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
