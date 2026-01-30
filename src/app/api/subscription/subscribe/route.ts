import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { sendInvoice } from "@/lib/email";

// Define plan type locally to avoid importing from Prisma Client
type SubscriptionPlan = "FREE" | "BRONZE_100" | "BRONZE_300" | "GOLD";

const plans = {
  FREE: { price: 0, name: "Free Plan", limit: "Friend-based" },
  BRONZE_100: { price: 100, name: "Bronze Plan (₹100)", limit: 10 },
  BRONZE_300: { price: 300, name: "Bronze Plan (₹300)", limit: 20 },
  GOLD: { price: 1000, name: "Gold Plan", limit: Infinity },
};

function isPaymentTimeAllowed(): boolean {
  const now = new Date();
  // IST is UTC+5:30. 
  // To get IST hour from UTC:
  // UTC 04:30 is IST 10:00
  // UTC 07:30 is IST 13:00
  
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = utcMinutes + 330; // 5 hours 30 mins
  const istHour = (Math.floor(istMinutes / 60)) % 24;
  
  // 10 AM to 11 AM IST (10:00 to 10:59)
  return istHour === 10;
}

export async function POST(req: Request) {
  // Check timing (10 AM - 11 AM IST)
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

  const body = await req.json();
  const planKey = body.plan as SubscriptionPlan;

  if (!plans[planKey]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { price, name } = plans[planKey];

  // Simulate payment processing (Stripe/Razorpay)
  console.log(`Processing payment for ${name} - ₹${price}`);

  // Assume payment successful
  const paymentSuccessful = true;

  if (!paymentSuccessful) {
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }

  // Get user email
  const { data: user, error: userError } = await supabase
    .from('User')
    .select('email')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Save subscription
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

  const { error: subError } = await supabase
    .from('Subscription')
    .insert({
      user_id: userId,
      plan: planKey,
      price: price,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: "ACTIVE",
      paymentId: `pay_${Date.now()}`, // Mock payment ID
    });

  if (subError) {
    console.error("Subscription Create Error:", subError);
    // Continue anyway to try updating user (or rollback in a real transaction)
  }

  // Update user's current plan
  // Mapping: subscriptionPlan -> subscription_plan (as per SQL)
  const { error: updateError } = await supabase
    .from('User')
    .update({ subscription_plan: planKey })
    .eq('id', userId);

  if (updateError) {
    console.error("User Plan Update Error:", updateError);
    return NextResponse.json({ error: "Failed to update user plan" }, { status: 500 });
  }

  // Send invoice email
  try {
    await sendInvoice(user.email, name);
  } catch (error) {
    console.error("Failed to send invoice:", error);
  }

  return NextResponse.json({ success: true, message: "Subscription activated" });
}
