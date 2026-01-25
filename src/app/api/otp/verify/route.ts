import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { otp } = await req.json();

  const store = globalThis.__otpStore;

  if (!store || store.expires < Date.now()) {
    return NextResponse.json({ error: "OTP expired" }, { status: 400 });
  }

  if (Number(otp) !== store.otp) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  return NextResponse.json({ success: true, lang: store.lang });
}
