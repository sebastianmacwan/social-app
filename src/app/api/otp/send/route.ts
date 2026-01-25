import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { type, lang } = await req.json();

  const otp = Math.floor(100000 + Math.random() * 900000);

  // TEMP: store OTP (replace with Redis later)
  globalThis.__otpStore = {
    otp,
    lang,
    expires: Date.now() + 5 * 60 * 1000,
  };

  console.log(
    type === "email"
      ? `📧 Email OTP for ${lang}: ${otp}`
      : `📱 Mobile OTP for ${lang}: ${otp}`
  );

  return NextResponse.json({ success: true });
}
