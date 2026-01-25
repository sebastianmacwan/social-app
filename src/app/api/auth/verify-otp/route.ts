import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const { otp } = await req.json();

  console.log("Verifying OTP:", otp);
  console.log("Store:", globalThis.__loginOtpStore);

  const store = globalThis.__loginOtpStore;
  if (!store || store.otp !== otp.trim() || Date.now() > store.expires) {
    return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
  }

  // Create login history (simplified) - disabled in simplified schema
  // await prisma.loginHistory.create({
  //   data: {
  //     userId: store.userId,
  //     ip: "127.0.0.1",
  //     browser: "Chrome",
  //     os: "Unknown",
  //     device: "Unknown",
  //     isSuspicious: false,
  //   },
  // });

  const res = NextResponse.json({ message: "Login successful" });
  res.cookies.set("userId", String(store.userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  // Clear store
  delete globalThis.__loginOtpStore;

  return res;
}