import { NextResponse } from "next/server";
import supabase from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get sent friend requests where current user is the userId
  const { data: sentRequests, error: sentError } = await supabase
    .from('Friend')
    .select('id, friend_id')
    .eq('user_id', userId)
    .eq('status', 'PENDING');

  if (sentError) {
    console.error("Sent requests error:", sentError);
    return NextResponse.json({ error: "Failed to fetch sent requests" }, { status: 500 });
  }

  if (!sentRequests || sentRequests.length === 0) {
    return NextResponse.json([]);
  }

  const friendIds = sentRequests.map(r => r.friend_id);

  const { data: users, error: usersError } = await supabase
    .from('User')
    .select('id, name, email')
    .in('id', friendIds);

  if (usersError) {
    console.error("Users error:", usersError);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  const userMap = new Map(users.map(u => [u.id, u]));

  return NextResponse.json(sentRequests.map(req => ({
    id: req.id,
    user: userMap.get(req.friend_id)
  })));
}