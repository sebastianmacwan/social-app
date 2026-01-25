import { NextResponse } from "next/server";
import supabase from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get pending friend requests where current user is the friendId
  const { data: pendingRequests, error: pendingError } = await supabase
    .from('Friend')
    .select('id, user_id')
    .eq('friend_id', userId)
    .eq('status', 'PENDING');

  if (pendingError) {
    console.error("Pending requests error:", pendingError);
    return NextResponse.json({ error: "Failed to fetch pending requests" }, { status: 500 });
  }

  if (!pendingRequests || pendingRequests.length === 0) {
    return NextResponse.json([]);
  }

  const userIds = pendingRequests.map(r => r.user_id);

  const { data: users, error: usersError } = await supabase
    .from('User')
    .select('id, name, email')
    .in('id', userIds);

  if (usersError) {
    console.error("Users error:", usersError);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  const userMap = new Map(users.map(u => [u.id, u]));

  return NextResponse.json(pendingRequests.map(req => ({
    id: req.id,
    user: userMap.get(req.user_id)
  })));
}
