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
    const {
      reservationId,
      extensionType = "hours",
      additionalHours,
      requestedTimeLabel,
      newCheckOutDate,
      notes,
    } = body;

    if (!reservationId) {
      return NextResponse.json({ error: "Reservation ID is required." }, { status: 400 });
    }

    const supabase = createStatelessAdminClient() as any;

    const { data: reservation, error: fetchErr } = await supabase
      .from("reservations")
      .select("*, rooms(id, room_number), room_types(name), guests(first_name, last_name, email)")
      .eq("id", reservationId)
      .maybeSingle();

    if (fetchErr || !reservation) {
      return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    }

    if (!["confirmed", "checked_in"].includes(reservation.status)) {
      return NextResponse.json(
        { error: `Only confirmed or checked-in reservations can request a time extension.` },
        { status: 400 }
      );
    }

    if (extensionType === "days") {
      if (!newCheckOutDate || newCheckOutDate <= reservation.check_out_date) {
        return NextResponse.json(
          { error: "New check-out date must be after the current check-out date." },
          { status: 400 }
        );
      }
    }

    const confCode = reservation.confirmation_number ?? reservation.id.slice(0, 8);
    const guestName = `${reservation.guests?.first_name ?? "Guest"} ${reservation.guests?.last_name ?? ""}`.trim();
    const roomText = reservation.rooms?.room_number
      ? `Room ${reservation.rooms.room_number}`
      : reservation.room_types?.name ?? "Room";

    const extensionSummary =
      extensionType === "days"
        ? `Extend stay check-out date from ${reservation.check_out_date} to ${newCheckOutDate}`
        : `Late check-out time extension: ${requestedTimeLabel || `+${additionalHours || 2} hours`}`;

    const { data: notification, error: notifErr } = await supabase
      .from("notifications")
      .insert({
        hotel_id: reservation.hotel_id,
        user_id: reservation.profile_id || null,
        title: "Booking Time Extension Request",
        message: `${guestName} (${confCode}, ${roomText}) requested: ${extensionSummary}.${notes ? ` Note: ${notes}` : ""}`,
        type: "checkout_reminder",
        data: {
          category: "booking_extension",
          status: "pending",
          reservation_id: reservation.id,
          confirmation_number: confCode,
          guest_name: guestName,
          room_number: reservation.rooms?.room_number ?? null,
          extension_type: extensionType,
          additional_hours: additionalHours || null,
          requested_time_label: requestedTimeLabel || null,
          current_check_out: reservation.check_out_date,
          requested_check_out: newCheckOutDate || null,
          notes: notes || null,
        },
        is_read: false,
      })
      .select("id")
      .single();

    if (notifErr) throw notifErr;

    return NextResponse.json({
      success: true,
      notificationId: notification?.id,
      message: "Booking time extension request sent to hotel administration.",
    });
  } catch (err: any) {
    console.error("Booking extension error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit booking time extension request." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { notificationId, action = "approve" } = await req.json();
    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required." }, { status: 400 });
    }

    const supabase = createStatelessAdminClient() as any;

    const { data: notif, error: fetchErr } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .maybeSingle();

    if (fetchErr || !notif) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    const data = (notif.data || {}) as Record<string, any>;
    const newStatus = action === "decline" ? "declined" : "approved";

    // If approved and requested_check_out date was specified, check conflict and update reservation
    if (newStatus === "approved" && data.reservation_id && data.requested_check_out) {
      const { data: resRow } = await supabase
        .from("reservations")
        .select("id, room_id, check_in_date, check_out_date, room_rate, tax_amount, subtotal, total_amount")
        .eq("id", data.reservation_id)
        .maybeSingle();

      if (resRow) {
        if (resRow.room_id) {
          const { data: conflict } = await supabase
            .from("reservations")
            .select("id")
            .eq("room_id", resRow.room_id)
            .neq("id", resRow.id)
            .not("status", "in", '("cancelled","refunded","checked_out")')
            .lt("check_in_date", data.requested_check_out)
            .gt("check_out_date", resRow.check_out_date)
            .limit(1);

          if (conflict && conflict.length > 0) {
            return NextResponse.json(
              { error: "Cannot approve date extension: room is already booked for the extended dates." },
              { status: 409 }
            );
          }
        }

        const newNights = Math.max(
          1,
          Math.round(
            (new Date(data.requested_check_out).getTime() - new Date(resRow.check_in_date).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        );
        const rate = Number(resRow.room_rate || 0);
        const newSubtotal = rate * newNights;
        const newTax = Math.round(newSubtotal * 0.12 * 100) / 100;
        const newTotal = Math.round((newSubtotal + newTax) * 100) / 100;

        await supabase
          .from("reservations")
          .update({
            check_out_date: data.requested_check_out,
            subtotal: newSubtotal,
            tax_amount: newTax,
            total_amount: newTotal,
            updated_at: new Date().toISOString(),
          })
          .eq("id", resRow.id);
      }
    }

    const updatedData = { ...data, status: newStatus, resolved_at: new Date().toISOString() };
    await supabase
      .from("notifications")
      .update({ data: updatedData, is_read: true })
      .eq("id", notificationId);

    // Notify guest if reservation has a user profile
    if (notif.user_id) {
      await supabase.from("notifications").insert({
        hotel_id: notif.hotel_id,
        user_id: notif.user_id,
        title: newStatus === "approved" ? "Booking Extension Approved" : "Booking Extension Declined",
        message:
          newStatus === "approved"
            ? `Your booking time extension request for ${data.confirmation_number ?? "your stay"} has been approved.`
            : `Your booking time extension request for ${data.confirmation_number ?? "your stay"} could not be accommodated.`,
        type: "checkout_reminder",
        data: { ...updatedData, category: "booking_extension" },
        is_read: false,
      });
    }

    return NextResponse.json({ success: true, status: newStatus, data: updatedData });
  } catch (err: any) {
    console.error("Extension action error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update extension request." },
      { status: 500 }
    );
  }
}
