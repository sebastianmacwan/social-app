import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { otp, targetLanguage } = await req.json();

    if (!otp || !targetLanguage) {
      return NextResponse.json({ error: "OTP and target language required" }, { status: 400 });
    }

    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify OTP from OTP table
    const otpString = String(otp).trim();
    console.log(`Verifying Language OTP for user ${userId}: ${otpString}`);

    const { data: otpRecord, error: otpError } = await supabase
      .from('OTP')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'language_switch')
      .eq('otp', otpString)
      .eq('lang', targetLanguage)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error("Language OTP Query Error:", otpError);
    }

    if (!otpRecord) {
      console.log("Language OTP not found or expired");
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // Success - Update Language
    const { error: updateError } = await supabase
      .from('User')
      .update({ preferredLanguage: targetLanguage })
      .eq('id', userId);

    if (updateError) {
      console.error("Language Update Error:", updateError);
      return NextResponse.json({ error: "Failed to update language" }, { status: 500 });
    }

    // Delete used OTP
    await supabase
      .from('OTP')
      .delete()
      .eq('id', otpRecord.id);

    return NextResponse.json({ success: true, message: "Language updated" });

  } catch (error) {
    console.error("Language Verify Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
