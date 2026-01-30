import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all users except self
  const { data: users, error: usersError } = await supabase
    .from('User')
    .select('id, name, email')
    .neq('id', userId);

  if (usersError) {
    console.error("Users error:", usersError);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  // Get all friend relationships for current user (both directions)
  const { data: friendsData, error: friendsError } = await supabase
    .from('Friend')
    .select('user_id, friend_id, status')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  if (friendsError) {
    console.error("Friends error:", friendsError);
    return NextResponse.json({ error: "Failed to fetch friends data" }, { status: 500 });
  }

  // Create a map of userId to status for quick lookup
  const friendStatusMap = new Map();
  friendsData?.forEach(friend => {
    const otherUserId = friend.user_id === userId ? friend.friend_id : friend.user_id;
    friendStatusMap.set(otherUserId, friend.status);
  });

  // Add status to users
  const usersWithStatus = users.map(user => ({
    ...user,
    status: friendStatusMap.get(user.id) || null,
  }));

  return NextResponse.json(usersWithStatus);
}
