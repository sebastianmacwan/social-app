import { NextResponse } from "next/server";
import supabase from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await req.json();

  if (!requestId) {
    return NextResponse.json({ error: "Request ID required" }, { status: 400 });
  }

  // Delete the pending friend request - verify it belongs to current user first
  const { error: deleteError } = await supabase
    .from('Friend')
    .delete()
    .eq('id', requestId)
    .eq('friend_id', userId)
    .eq('status', 'PENDING');

  if (deleteError) {
    console.error("Delete error:", deleteError);
    return NextResponse.json({ error: "Failed to reject friend request" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
