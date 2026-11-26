/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase.types";
import { sendEmail, formatPhp } from "@/lib/email";

function createStatelessAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return []; },
      setAll() {},
    },
  });
}

const CANCELLATION_FEE_RATE = 0.10; // 10% deduction upon cancellation

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reservationId, confirmationNumber, email, reason } = body;

    if (!reservationId && !confirmationNumber) {
      return NextResponse.json(
        { error: "Reservation ID or Confirmation Number is required." },
        { status: 400 }
      );
    }

    const supabase = createStatelessAdminClient() as any;

    let query = supabase
      .from("reservations")
      .select("*, rooms(id, room_number), room_types(name), guests(id, first_name, last_name, email), hotels(name)");

    if (reservationId) {
      query = query.eq("id", reservationId);
    } else if (confirmationNumber) {
      query = query.eq("confirmation_number", confirmationNumber.trim().toUpperCase());
    }

    const { data: reservation, error: fetchErr } = await query.maybeSingle();

    if (fetchErr || !reservation) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    // If confirmation number was used without reservationId, check email match for security
    if (!reservationId && email) {
      const guestEmail = reservation.guests?.email?.toLowerCase().trim();
      if (guestEmail && guestEmail !== email.toLowerCase().trim()) {
        return NextResponse.json(
          { error: "Email does not match reservation records." },
          { status: 403 }
        );
      }
    }

    if (reservation.status === "cancelled") {
      return NextResponse.json(
        { error: "This reservation is already cancelled." },
        { status: 400 }
      );
    }

    if (["checked_in", "checked_out"].includes(reservation.status)) {
      return NextResponse.json(
        { error: `Cannot cancel a reservation with status '${reservation.status}'. Please contact the front desk directly.` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 1. Fetch completed payments to determine exact refundable amount
    const { data: completedPayments } = await supabase
      .from("payments")
      .select("id, amount, gateway, transaction_id, status")
      .eq("reservation_id", reservation.id)
      .eq("status", "completed");

    const paymentsList = (completedPayments ?? []) as any[];
    const paymentsSum = paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const paidAmount = Math.max(Number(reservation.paid_amount || 0), paymentsSum);

    const deductedAmount = paidAmount > 0 ? Math.round(paidAmount * CANCELLATION_FEE_RATE * 100) / 100 : 0;
    const refundedAmount = paidAmount > 0 ? Math.round((paidAmount - deductedAmount) * 100) / 100 : 0;

    // 2. Update reservation status to cancelled
    const { error: updateErr } = await supabase
      .from("reservations")
      .update({
        status: "cancelled",
        cancelled_at: now,
        cancellation_reason: reason || null,
        updated_at: now,
      })
      .eq("id", reservation.id);

    if (updateErr) throw updateErr;

    // 3. Process payment refund records if payment was collected
    if (paidAmount > 0 && paymentsList.length > 0) {
      for (const payment of paymentsList) {
        const paymentAmt = Number(payment.amount || 0);
        const paymentDeducted = Math.round(paymentAmt * CANCELLATION_FEE_RATE * 100) / 100;
        const paymentRefunded = Math.round((paymentAmt - paymentDeducted) * 100) / 100;

        // If real Stripe PaymentIntent, attempt partial refund gracefully
        if (
          payment.gateway === "stripe" &&
          typeof payment.transaction_id === "string" &&
          payment.transaction_id.startsWith("pi_") &&
          process.env.STRIPE_SECRET_KEY
        ) {
          try {
            const Stripe = (await import("stripe")).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
              apiVersion: "2025-01-27.acacia" as any,
            });
            await stripe.refunds.create({
              payment_intent: payment.transaction_id,
              amount: Math.round(paymentRefunded * 100),
            });
          } catch (stripeErr: any) {
            console.warn("Stripe refund skipped/failed:", stripeErr?.message ?? stripeErr);
          }
        }

        await supabase
          .from("payments")
          .update({ status: "partially_refunded", updated_at: now })
          .eq("id", payment.id);

        try {
          await supabase.from("refunds").insert({
            payment_id: payment.id,
            reservation_id: reservation.id,
            amount: paymentRefunded,
            reason: `Cancellation refund (10% fee of ${formatPhp(paymentDeducted)} deducted)${reason ? ` — ${reason}` : ""}`,
            status: "completed",
            transaction_id: `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            processed_at: now,
          });
        } catch (refundErr: any) {
          console.warn("Refund record insert warning:", refundErr?.message ?? refundErr);
        }
      }
    }

    // 4. Free up assigned room if any
    if (reservation.room_id) {
      await supabase
        .from("rooms")
        .update({ status: "available" })
        .eq("id", reservation.room_id);
    }

    const confCode = reservation.confirmation_number ?? reservation.id.slice(0, 8);
    const guestName = `${reservation.guests?.first_name ?? "Guest"} ${reservation.guests?.last_name ?? ""}`.trim();
    const hotelName = reservation.hotels?.name || process.env.NEXT_PUBLIC_HOTEL_NAME || "Grand Azure Hotel & Resort";
    const roomLabel = reservation.rooms?.room_number
      ? `Room ${reservation.rooms.room_number} (${reservation.room_types?.name ?? "Suite"})`
      : reservation.room_types?.name ?? "Reserved Room";

    // 5. Resolve guest email and dispatch cancellation + refund breakdown email
    let recipientEmail: string | null = reservation.guests?.email || null;
    if (!recipientEmail && reservation.profile_id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", reservation.profile_id)
        .maybeSingle();
      recipientEmail = prof?.email || null;
    }

    let emailResult: { sent: boolean; mode: "resend" | "simulated" } = {
      sent: false,
      mode: "simulated",
    };

    if (recipientEmail) {
      const refundSummaryHtml =
        paidAmount > 0
          ? `
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:18px 0;">
              <h3 style="margin:0 0 10px 0;font-size:15px;color:#0f172a;">Refund Summary</h3>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr>
                  <td style="padding:6px 0;color:#475569;">Amount Originally Paid</td>
                  <td style="padding:6px 0;text-align:right;font-weight:600;color:#0f172a;">${formatPhp(paidAmount)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#b45309;">Cancellation Fee Deducted (10%)</td>
                  <td style="padding:6px 0;text-align:right;font-weight:600;color:#b45309;">- ${formatPhp(deductedAmount)}</td>
                </tr>
                <tr style="border-top:1px solid #cbd5e1;">
                  <td style="padding:10px 0 0 0;font-weight:700;color:#047857;">Total Amount Refunded (90%)</td>
                  <td style="padding:10px 0 0 0;text-align:right;font-weight:700;font-size:16px;color:#047857;">${formatPhp(refundedAmount)}</td>
                </tr>
              </table>
            </div>
            <p style="font-size:14px;color:#334155;line-height:1.6;">
              Your remaining balance of <strong>${formatPhp(refundedAmount)}</strong> (after the 10% cancellation deduction of <strong>${formatPhp(deductedAmount)}</strong>) has been processed and is being returned to your payment account.
            </p>
          `
          : `
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:18px 0;font-size:14px;color:#334155;">
              <p style="margin:0;"><strong>Amount Paid:</strong> ${formatPhp(0)} (Pay at Hotel)</p>
              <p style="margin:6px 0 0 0;"><strong>Deducted Amount (10%):</strong> ${formatPhp(0)}</p>
              <p style="margin:6px 0 0 0;"><strong>Total Refunded:</strong> ${formatPhp(0)} — No online payment was collected for this booking.</p>
            </div>
          `;

      const subject = `Reservation Cancelled & Refund Confirmation (${confCode}) — ${hotelName}`;
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
          <div style="background:#1a2744;color:#ffffff;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;font-size:20px;color:#e2ae38;">${hotelName}</h1>
            <p style="margin:6px 0 0 0;font-size:13px;color:#cbd5e1;">Booking Cancellation &amp; Refund Notice</p>
          </div>
          <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;background:#ffffff;">
            <p style="font-size:15px;">Dear <strong>${guestName}</strong>,</p>
            <p style="font-size:14px;color:#334155;line-height:1.6;">
              Your reservation <strong>${confCode}</strong> for <strong>${roomLabel}</strong> (${reservation.check_in_date} to ${reservation.check_out_date}) has been cancelled.${reason ? ` Reason: <em>${reason}</em>.` : ""}
            </p>
            ${refundSummaryHtml}
            <p style="font-size:12px;color:#64748b;margin-top:24px;">
              Thank you for choosing ${hotelName}. If you have questions regarding your refund, please reply to this email or contact our front desk.
            </p>
          </div>
        </div>
      `;

      const text = [
        `Dear ${guestName},`,
        "",
        `Your reservation ${confCode} for ${roomLabel} (${reservation.check_in_date} to ${reservation.check_out_date}) at ${hotelName} has been cancelled.`,
        reason ? `Reason: ${reason}` : "",
        "",
        `Original Amount Paid: ${formatPhp(paidAmount)}`,
        `Cancellation Deduction (10%): ${formatPhp(deductedAmount)}`,
        `Total Amount Refunded (90%): ${formatPhp(refundedAmount)}`,
        "",
        paidAmount > 0
          ? `Your refund of ${formatPhp(refundedAmount)} is being returned to you after the 10% cancellation fee deduction.`
          : "No online payment was collected for this booking.",
      ]
        .filter(Boolean)
        .join("\n");

      const resEmail = await sendEmail({
        to: recipientEmail,
        subject,
        html,
        text,
        template: "cancellation_refund",
        hotelId: reservation.hotel_id,
      });
      emailResult = { sent: resEmail.sent, mode: resEmail.mode };
    }

    // 6. Create notification for staff/admin and guest
    try {
      const refundNote =
        paidAmount > 0
          ? ` Refunded: ${formatPhp(refundedAmount)} (10% deduction: ${formatPhp(deductedAmount)}).`
          : "";
      await supabase.from("notifications").insert({
        hotel_id: reservation.hotel_id,
        user_id: reservation.profile_id || null,
        title: "Booking Cancelled & Refund Processed",
        message: `Reservation ${confCode} (${guestName}) was cancelled.${refundNote}${reason ? ` Reason: ${reason}` : ""}`,
        type: "booking_cancellation",
        data: {
          reservation_id: reservation.id,
          confirmation_number: confCode,
          paid_amount: paidAmount,
          deducted_amount: deductedAmount,
          refunded_amount: refundedAmount,
          recipient_email: recipientEmail,
        },
        is_read: false,
      });
    } catch {
      // Notification insert is non-fatal
    }

    return NextResponse.json({
      success: true,
      message:
        paidAmount > 0
          ? `Reservation cancelled. ${formatPhp(refundedAmount)} refunded after 10% deduction (${formatPhp(deductedAmount)}).`
          : "Reservation has been cancelled successfully.",
      confirmationNumber: confCode,
      paidAmount,
      deductedAmount,
      refundedAmount,
      emailSent: emailResult.sent,
      emailMode: emailResult.mode,
      recipientEmail,
    });
  } catch (err: any) {
    console.error("Cancellation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to cancel reservation." },
      { status: 500 }
    );
  }
}
