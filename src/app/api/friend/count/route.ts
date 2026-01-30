import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ count: 0 });
  }

  // Count accepted friends from Friend table (both directions)
  const { count: friendsCount, error: friendsError } = await supabase
    .from('Friend')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'ACCEPTED');

  if (friendsError) {
    console.error('Friends count error:', friendsError);
    return NextResponse.json({ count: 0 });
  }

  // Also count reverse friendships (where user is the friendId)
  const { count: reverseFriendsCount, error: reverseFriendsError } = await supabase
    .from('Friend')
    .select('*', { count: 'exact', head: true })
    .eq('friend_id', userId)
    .eq('status', 'ACCEPTED');

  if (reverseFriendsError) {
    console.error('Reverse friends count error:', reverseFriendsError);
  }

  const totalFriendsCount = (friendsCount || 0) + (reverseFriendsCount || 0);

  return NextResponse.json({ count: totalFriendsCount });
}
