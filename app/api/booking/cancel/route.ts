/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase.types";

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

    let query = supabase.from("reservations").select("*, rooms(id, room_number), guests(first_name, last_name, email)");

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

    // 1. Update reservation status to cancelled
    const { error: updateErr } = await supabase
      .from("reservations")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation.id);

    if (updateErr) throw updateErr;

    // 2. Free up assigned room if any
    if (reservation.room_id) {
      await supabase
        .from("rooms")
        .update({ status: "available" })
        .eq("id", reservation.room_id);
    }

    // 3. Create a notification for staff/admin
    try {
      await supabase.from("notifications").insert({
        hotel_id: reservation.hotel_id,
        user_id: reservation.profile_id || null,
        title: "Booking Cancelled",
        message: `Reservation ${reservation.confirmation_number ?? reservation.id.slice(0, 8)} (${reservation.guests?.first_name ?? "Guest"} ${reservation.guests?.last_name ?? ""}) was cancelled.${reason ? ` Reason: ${reason}` : ""}`,
        type: "booking_cancellation",
        is_read: false,
      });
    } catch {
      // Notification insert is non-fatal
    }

    return NextResponse.json({
      success: true,
      message: "Reservation has been cancelled successfully.",
      confirmationNumber: reservation.confirmation_number,
    });
  } catch (err: any) {
    console.error("Cancellation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to cancel reservation." },
      { status: 500 }
    );
  }
}
