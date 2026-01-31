import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";
import { sendOTP } from "@/lib/email";
import { sendSMSOTP } from "@/lib/sms";

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
      const sent = await sendOTP(user.email, generatedOTP, 'language_switch');
      console.log(`Email OTP attempted to ${user.email}. Success: ${sent}`);
      if (!sent) {
        return NextResponse.json({ error: "Failed to send email OTP. Please check if SENDGRID_API_KEY is correctly set in Vercel environment variables." }, { status: 500 });
      }
      return NextResponse.json({ message: "OTP sent to email: " + user.email });
    } else {
      // Send Mobile OTP
      if (!user.phone) {
        return NextResponse.json({ error: "Phone number required for this language" }, { status: 400 });
      }
      
      const sent = await sendSMSOTP(user.phone, generatedOTP, targetLanguage);
      console.log(`Mobile OTP status for ${user.phone}: ${sent ? 'SUCCESS' : 'FAILED'}`);
      
      if (!sent) {
        return NextResponse.json({ 
          error: "Failed to send mobile OTP. Please ensure your phone number is in international format (e.g., +91XXXXXXXXXX) and is a 'Verified Caller ID' in your Twilio Trial account." 
        }, { status: 500 });
      }
      
      // If Twilio keys are missing, sendSMSOTP returns true and logs to console
      const isSimulated = !process.env.TWILIO_ACCOUNT_SID;
      return NextResponse.json({ 
        message: isSimulated 
          ? "SIMULATED OTP: Check server console for code (Free/Development mode)" 
          : "Real OTP sent to your mobile number: " + user.phone 
      });
    }

  } catch (error) {
    console.error("Language OTP Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
