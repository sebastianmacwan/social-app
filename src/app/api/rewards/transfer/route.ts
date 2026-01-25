import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { transferPoints } from "@/lib/rewards";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { toUserId, amount } = await req.json();
  if (!toUserId || !amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await transferPoints(userId, toUserId, amount);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ message: "Points transferred successfully" });
}