/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase.types";

function createStatelessAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const {
      hotelId,
      roomTypeId,
      roomTypeName,
      checkInDate,
      checkOutDate,
      adults,
      children,
      extras,
      subtotal,
      taxAmount,
      totalAmount,
      guestEmail,
      guestFirstName,
      guestLastName,
      guestPhone,
      profileId,
    } = await req.json();

    if (!hotelId || !roomTypeId || !checkInDate || !checkOutDate || !totalAmount || !guestEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createStatelessAdminClient() as any;

    // 0. Double-booking check: Decline if all rooms of this type are already taken for these dates
    const { data: totalRooms } = await supabase
      .from("rooms")
      .select("id")
      .eq("room_type_id", roomTypeId)
      .eq("is_active", true);

    const { data: overlappingReservations } = await supabase
      .from("reservations")
      .select("id, room_id")
      .eq("room_type_id", roomTypeId)
      .not("status", "in", '("cancelled","refunded","checked_out")')
      .lt("check_in_date", checkOutDate)
      .gt("check_out_date", checkInDate);

    if (
      totalRooms &&
      totalRooms.length > 0 &&
      overlappingReservations &&
      overlappingReservations.length >= totalRooms.length
    ) {
      return NextResponse.json(
        {
          error: "Booking Declined: All suites of this category are fully booked for your selected dates. Please select different dates.",
          code: "ROOM_OCCUPIED",
        },
        { status: 409 }
      );
    }

    const bookedRoomIds = new Set((overlappingReservations || []).map((r: any) => r.room_id).filter(Boolean));
    const availableRoom = (totalRooms || []).find((r: any) => !bookedRoomIds.has(r.id));
    const assignedRoomId = availableRoom?.id || null;

    // 1. Create or retrieve the Guest record
    let guestId: string | null = null;

    const { data: existingGuest } = await supabase
      .from("guests")
      .select("id")
      .eq("email", guestEmail)
      .eq("hotel_id", hotelId)
      .maybeSingle();

    if (existingGuest) {
      guestId = existingGuest.id;
    } else {
      const { data: newGuest, error: guestErr } = await supabase
        .from("guests")
        .insert({
          hotel_id: hotelId,
          profile_id: profileId || null,
          first_name: guestFirstName,
          last_name: guestLastName,
          email: guestEmail,
          phone: guestPhone || null,
        })
        .select("id")
        .single();

      if (guestErr) throw guestErr;
      guestId = newGuest.id;
    }

    // 2. Generate confirmation number
    const confirmationNumber = "CONF-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    // 3. Create Reservation record
    const { data: reservation, error: resErr } = await supabase
      .from("reservations")
      .insert({
        hotel_id: hotelId,
        room_id: assignedRoomId,
        confirmation_number: confirmationNumber,
        guest_id: guestId,
        profile_id: profileId || null,
        room_type_id: roomTypeId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        adults: parseInt(adults || "1", 10),
        children: parseInt(children || "0", 10),
        room_rate: parseFloat(subtotal) / (new Date(checkOutDate).getDate() - new Date(checkInDate).getDate() || 1),
        subtotal: parseFloat(subtotal),
        tax_amount: parseFloat(taxAmount || "0"),
        total_amount: parseFloat(totalAmount),
        paid_amount: parseFloat(totalAmount),
        status: "confirmed",
        extras: extras || [],
        source: "direct",
      })
      .select("id")
      .single();

    if (resErr) throw resErr;

    // 4. Resolve the GCash payment method ID
    const { data: dbPaymentMethod } = await supabase
      .from("payment_methods")
      .select("id")
      .eq("type", "gcash")
      .maybeSingle();

    const paymentMethodId = dbPaymentMethod?.id || null;

    // 5. Create Payment record
    const { error: payErr } = await supabase
      .from("payments")
      .insert({
        hotel_id: hotelId,
        reservation_id: reservation.id,
        guest_id: guestId,
        payment_method_id: paymentMethodId,
        amount: parseFloat(totalAmount),
        currency: "PHP",
        status: "completed",
        transaction_id: "GCASH-" + Math.random().toString(36).substring(2, 12).toUpperCase(),
        gateway: "gcash",
        gateway_response: { provider: "gcash", status: "success", mock: true },
        processed_at: new Date().toISOString(),
      });

    if (payErr) throw payErr;

    return NextResponse.json({ success: true, confirmationNumber });
  } catch (error: any) {
    console.error("GCash Checkout Server Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process GCash transaction" }, { status: 500 });
  }
}
