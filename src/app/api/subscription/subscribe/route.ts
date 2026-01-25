import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getCurrentUserId } from "@/lib/auth";
import supabase from "@/lib/prisma";
import { sendInvoice } from "@/lib/email";

const plans = {
  bronze: { price: 100, name: "Bronze Plan" },
  silver: { price: 300, name: "Silver Plan" },
  gold: { price: 1000, name: "Gold Plan" },
};

function isPaymentTimeAllowed(): boolean {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);
  const hour = istTime.getUTCHours();
  return hour >= 10 && hour < 11;
}

export async function POST(req: Request) {
  if (!isPaymentTimeAllowed()) {
    return NextResponse.json(
      { error: "Payments are only allowed between 10 AM and 11 AM IST" },
      { status: 403 }
    );
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await req.json();
  if (!plans[plan as keyof typeof plans]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { price, name } = plans[plan as keyof typeof plans];

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name,
              description: `Subscription for ${name}`,
            },
            unit_amount: price * 100, // in paisa
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription?canceled=true`,
      metadata: {
        userId,
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 });
  }
}
