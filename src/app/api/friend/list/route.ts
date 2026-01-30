import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get accepted friends from Friend table (both directions)
  const { data: friendsData, error: friendsError } = await supabase
    .from('Friend')
    .select('user_id, friend_id')
    .eq('status', 'ACCEPTED')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  if (friendsError) {
    console.error("Friends error:", friendsError);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }

  const friendIds = friendsData?.map(f => f.user_id === userId ? f.friend_id : f.user_id) || [];

  if (friendIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: friends, error: friendsListError } = await supabase
    .from('User')
    .select('id, name, email')
    .in('id', friendIds);

  if (friendsListError) {
    console.error("Friends list error:", friendsListError);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }

  return NextResponse.json(friends);
}
