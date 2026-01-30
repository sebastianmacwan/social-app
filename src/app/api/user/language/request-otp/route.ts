import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { sendOTP } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetLanguage } = await req.json();

    if (!targetLanguage) {
      return NextResponse.json({ error: "Target language required" }, { status: 400 });
    }

    const { data: user, error: userError } = await supabase
      .from('User')
      .select('email, phone')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    const { error: otpError } = await supabase
      .from('OTP')
      .insert({
        user_id: userId,
        otp: generatedOTP,
        type: 'language_switch',
        lang: targetLanguage,
        expires_at: otpExpiry.toISOString(),
      });

    if (otpError) {
      console.error("OTP Create Error:", otpError);
      return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
    }

    if (targetLanguage === 'fr') {
      // Send Email OTP
      await sendOTP(user.email, generatedOTP, 'language_switch');
      return NextResponse.json({ message: "OTP sent to email" });
    } else {
      // Send Mobile OTP
      if (!user.phone) {
        return NextResponse.json({ error: "Phone number required for this language" }, { status: 400 });
      }
      console.log(`📱 MOBILE OTP sent to ${user.phone}: ${generatedOTP}`);
      return NextResponse.json({ message: "OTP sent to mobile number" });
    }

  } catch (error) {
    console.error("Language OTP Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
