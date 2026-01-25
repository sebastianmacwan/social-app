import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { transferPoints } from "@/lib/rewards";

export async function POST(req: Request) {
  const senderId = await getCurrentUserId();
  if (!senderId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { receiverId, amount } = await req.json();

  if (!receiverId || !amount) {
    return NextResponse.json({ error: "Receiver ID and amount required" }, { status: 400 });
  }

  if (receiverId === senderId) {
    return NextResponse.json(
      { error: "Cannot transfer points to yourself" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Amount must be a positive integer" },
      { status: 400 }
    );
  }

  const result = await transferPoints(senderId, receiverId, amount);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
