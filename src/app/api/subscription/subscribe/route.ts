import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import supabase from "@/lib/prisma";
import { sendInvoice } from "@/lib/email";

const plans = {
  free: { price: 0, name: "Free Plan", postsPerDay: 1 },
  bronze: { price: 100, name: "Bronze Plan", postsPerDay: 5 },
  silver: { price: 300, name: "Silver Plan", postsPerDay: 10 },
  gold: { price: 1000, name: "Gold Plan", postsPerDay: -1 }, // unlimited
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

  const { price, name, postsPerDay } = plans[plan as keyof typeof plans];

  // Simulate payment processing
  // In a real app, integrate with payment gateway
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
  const { error: subError } = await supabase
    .from('Subscription')
    .upsert({
      user_id: userId,
      plan,
      posts_per_day: postsPerDay,
      price,
      created_at: new Date().toISOString(),
    });

  if (subError) {
    console.error("Subscription save error:", subError);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }

  // Send invoice email
  try {
    await sendInvoice(user.email, plan);
  } catch (error) {
    console.error("Failed to send invoice:", error);
  }

  return NextResponse.json({ success: true, message: "Subscription activated" });
}
