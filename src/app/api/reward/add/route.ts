import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { addPoints } from "@/lib/rewards";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount, reason } = await req.json();

  if (!amount || !reason) {
    return NextResponse.json({ error: "Amount and reason required" }, { status: 400 });
  }

  await addPoints(userId, amount, reason);

  return NextResponse.json({ success: true });
}
