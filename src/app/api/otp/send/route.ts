import { NextResponse } from "next/server";
import { sendOTP } from "@/lib/email";

export async function POST(req: Request) {
  const { type, lang, email } = await req.json();

  if (!email) {
    return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  // TEMP: store OTP (replace with Redis later)
  globalThis.__otpStore = {
    otp,
    lang,
    email,
    expires: Date.now() + 5 * 60 * 1000,
  };

  try {
    await sendOTP(email, otp.toString(), 'login', lang);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send OTP:", error);
    return NextResponse.json({ success: false, message: "Failed to send OTP" }, { status: 500 });
  }
}
