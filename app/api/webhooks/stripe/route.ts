/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase.types";

// Lazily initialized to avoid build-time failures when env vars are absent
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-01-27.acacia" as any,
  });
}

// Helper to create an admin client without cookies (since webhooks are stateless)
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
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (!metadata) {
      return NextResponse.json({ error: "No metadata in session" }, { status: 400 });
    }

    try {
      const supabase = createStatelessAdminClient() as any;

      // Retrieve Stripe Payment Method details
      let paymentMethodType = "credit_card";
      if (session.payment_intent) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            session.payment_intent as string,
            { expand: ["payment_method"] }
          );
          const pm = paymentIntent.payment_method as any;
          if (pm?.type === "gcash") {
            paymentMethodType = "gcash";
          } else if (pm?.type === "card") {
            paymentMethodType = "credit_card";
          }
        } catch (stripeErr) {
          console.error("Error retrieving Stripe Payment Intent details:", stripeErr);
        }
      }

      // Find the payment method ID from the database
      const { data: dbPaymentMethod } = await supabase
        .from("payment_methods")
        .select("id")
        .eq("type", paymentMethodType)
        .maybeSingle();

      const paymentMethodId = dbPaymentMethod?.id || null;

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

      // 1. Create or retrieve the Guest record
      let guestId: string | null = null;

      // Check if guest profile/record already exists by email
      const { data: existingGuest } = await supabase
        .from("guests")
        .select("id")
        .eq("email", guestEmail)
        .eq("hotel_id", hotelId)
        .maybeSingle();

      if (existingGuest) {
        guestId = existingGuest.id;
      } else {
        // Insert new guest record
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

      // 2. Generate a secure, unique confirmation number
      const confirmationNumber = "CONF-" + Math.random().toString(36).substring(2, 10).toUpperCase();

      // 3. Create the Reservation record
      const { data: reservation, error: resErr } = await supabase
        .from("reservations")
        .insert({
          hotel_id: hotelId,
          confirmation_number: confirmationNumber,
          guest_id: guestId,
          profile_id: profileId || null,
          room_type_id: roomTypeId,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          adults: parseInt(adults || "1", 10),
          children: parseInt(children || "0", 10),
          room_rate: parseFloat(subtotal) / (new Date(checkOutDate).getDate() - new Date(checkInDate).getDate() || 1), // rough rate
          subtotal: parseFloat(subtotal),
          tax_amount: parseFloat(taxAmount || "0"),
          total_amount: parseFloat(totalAmount),
          paid_amount: parseFloat(totalAmount), // Paid in full through Stripe Checkout
          status: "confirmed",
          extras: JSON.parse(extras || "[]"),
          source: "direct",
        })
        .select("id")
        .single();

      if (resErr) throw resErr;

      // 4. Create the Payment transaction record
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
          transaction_id: session.payment_intent as string || session.id,
          gateway: "stripe",
          gateway_response: JSON.parse(JSON.stringify(session)),
          processed_at: new Date().toISOString(),
        });

      if (payErr) throw payErr;

      console.log(`Successfully completed Stripe checkout reservation: ${confirmationNumber}`);
    } catch (dbError: any) {
      console.error("Database Webhook Integration Error:", dbError);
      return NextResponse.json({ error: "Failed to process database records" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
