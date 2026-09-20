/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase.types";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia" as any,
  });
}

function createStatelessClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const metadata = session.metadata;
    if (!metadata) {
      return NextResponse.json({ error: "No metadata in session" }, { status: 400 });
    }

    const supabase = createStatelessClient() as any;

    const {
      hotelId,
      roomTypeId,
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
    } = metadata;

    // Check if reservation for this transaction already exists
    const transactionId = (session.payment_intent as string) || session.id;
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("reservation_id")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    if (existingPayment?.reservation_id) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        reservationId: existingPayment.reservation_id,
      });
    }

    // 1. Create or retrieve Guest record
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

    // 2. Compute nights
    const checkInMs = new Date(checkInDate).getTime();
    const checkOutMs = new Date(checkOutDate).getTime();
    const nights = Math.max(1, Math.round((checkOutMs - checkInMs) / (1000 * 60 * 60 * 24)));

    // 3. Auto-assign available room
    const { data: totalRooms } = await supabase
      .from("rooms")
      .select("id")
      .eq("room_type_id", roomTypeId)
      .eq("is_active", true);

    const { data: overlappingReservations } = await supabase
      .from("reservations")
      .select("room_id")
      .eq("room_type_id", roomTypeId)
      .not("status", "in", '("cancelled","refunded","checked_out")')
      .lt("check_in_date", checkOutDate)
      .gt("check_out_date", checkInDate);

    const bookedRoomIds = new Set((overlappingReservations || []).map((r: any) => r.room_id).filter(Boolean));
    const availableRoom = (totalRooms || []).find((r: any) => !bookedRoomIds.has(r.id));
    const assignedRoomId = availableRoom?.id || null;

    const confirmationNumber = "CONF-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    // 4. Create Reservation
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
        room_rate: parseFloat(subtotal) / nights,
        subtotal: parseFloat(subtotal),
        tax_amount: parseFloat(taxAmount || "0"),
        total_amount: parseFloat(totalAmount),
        paid_amount: parseFloat(totalAmount),
        status: "confirmed",
        extras: JSON.parse(extras || "[]"),
        source: "direct",
      })
      .select("id")
      .single();

    if (resErr) throw resErr;

    // 5. Create Payment record
    const { data: dbPaymentMethod } = await supabase
      .from("payment_methods")
      .select("id")
      .eq("type", "credit_card")
      .maybeSingle();

    await supabase.from("payments").insert({
      hotel_id: hotelId,
      reservation_id: reservation.id,
      guest_id: guestId,
      payment_method_id: dbPaymentMethod?.id || null,
      amount: parseFloat(totalAmount),
      currency: "PHP",
      status: "completed",
      transaction_id: transactionId,
      gateway: "stripe",
      gateway_response: JSON.parse(JSON.stringify(session)),
      processed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      confirmationNumber,
      reservationId: reservation.id,
    });
  } catch (err: any) {
    console.error("Verification error:", err);
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 500 });
  }
}
