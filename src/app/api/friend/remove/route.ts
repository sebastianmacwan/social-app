import { NextResponse } from "next/server";
import supabase from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { friendId } = await req.json();

  if (!friendId) {
    return NextResponse.json({ error: "Friend ID required" }, { status: 400 });
  }

  // Delete friend relationship (in either direction)
  const { error: deleteError } = await supabase
    .from('Friend')
    .delete()
    .or(`and(userId.eq.${userId},friendId.eq.${friendId}),and(userId.eq.${friendId},friendId.eq.${userId})`);

  if (deleteError) {
    console.error("Delete error:", deleteError);
    return NextResponse.json({ error: "Failed to remove friend" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
