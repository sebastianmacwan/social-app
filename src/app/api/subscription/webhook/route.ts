import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { headers } from "next/headers";
import supabase from "@/lib/prisma";
import { sendInvoice } from "@/lib/email";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get("stripe-signature")!;

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, plan } = session.metadata!;

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Update user subscription
    const { error } = await supabase
      .from("User")
      .update({
        subscription_plan: plan,
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Subscription update error:", error);
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
    }

    // Get user email
    const { data: user } = await supabase
      .from("User")
      .select("email, name")
      .eq("id", userId)
      .single();

    // Send invoice email
    if (user?.email) {
      await sendInvoice(user.email, plan);
    }
  }

  return NextResponse.json({ received: true });
}