/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Lazily initialize Stripe client to prevent build-time crashes when STRIPE_SECRET_KEY is not set
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia" as any,
  });
}

export async function POST(req: Request) {
  const stripe = getStripe();
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

    // Double-booking check: Decline if all suites of this category are full for these dates
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const { createServerClient } = await import("@supabase/ssr");
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }) as any;

      // 0a. Check via PostgreSQL RPC if present
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc("check_availability", {
          p_room_type_id: roomTypeId,
          p_check_in: checkInDate,
          p_check_out: checkOutDate,
        });

        if (!rpcErr && rpcRes && rpcRes.is_available === false) {
          return NextResponse.json(
            {
              error: "Booking Declined: All rooms of this type are already booked for the selected dates. Please choose different dates.",
              code: "ROOM_OCCUPIED",
            },
            { status: 409 }
          );
        }
      } catch {
        // Fall through to direct table check
      }

      // 0b. Direct query check on rooms and reservations
      const { data: totalRooms } = await supabase
        .from("rooms")
        .select("id")
        .eq("room_type_id", roomTypeId)
        .eq("is_active", true);

      const { data: overlappingReservations } = await supabase
        .from("reservations")
        .select("id")
        .eq("room_type_id", roomTypeId)
        .not("status", "in", '("cancelled","refunded","checked_out")')
        .lt("check_in_date", checkOutDate)
        .gt("check_out_date", checkInDate);

      const capacity = totalRooms && totalRooms.length > 0 ? totalRooms.length : 3;
      const bookedCount = overlappingReservations ? overlappingReservations.length : 0;

      if (bookedCount >= capacity) {
        return NextResponse.json(
          {
            error: "Booking Declined: All rooms of this type are already booked for the selected dates. Please choose different dates.",
            code: "ROOM_OCCUPIED",
          },
          { status: 409 }
        );
      }
    }

    // Convert totalAmount to cents for Stripe
    const amountInCents = Math.round(totalAmount * 100);

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: guestEmail,
      line_items: [
        {
          price_data: {
            currency: "php",
            product_data: {
              name: roomTypeName,
              description: `Stay from ${checkInDate} to ${checkOutDate} (${adults} Adults, ${children} Children)`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/guest/reservations?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking?canceled=true`,
      metadata: {
        hotelId,
        roomTypeId,
        checkInDate,
        checkOutDate,
        adults: String(adults),
        children: String(children),
        extras: JSON.stringify(extras || []),
        subtotal: String(subtotal),
        taxAmount: String(taxAmount),
        totalAmount: String(totalAmount),
        guestEmail,
        guestFirstName,
        guestLastName,
        guestPhone: guestPhone || "",
        profileId: profileId || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Session Creation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create Stripe session" }, { status: 500 });
  }
}
