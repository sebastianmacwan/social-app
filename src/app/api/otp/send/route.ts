import { NextResponse } from "next/server";
import { sendOTP } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json();
  console.log("OTP send body:", body);

  const { type, lang, email } = body;

  if (!email) {
    console.log("Email missing in body");
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
