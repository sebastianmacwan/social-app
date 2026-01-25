import { NextResponse } from "next/server";
import supabase from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    // 1️⃣ Get user's accepted friends
    const { data: friends, error: friendsError } = await supabase
      .from('Friend')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'ACCEPTED');

    if (friendsError) {
      console.error('Friends error:', friendsError);
      return NextResponse.json([], { status: 200 });
    }

    const friendIds = friends?.map(f => f.friend_id) || [];

    // Also get bidirectional friendships (where user is the friendId)
    const { data: reverseFriends, error: reverseFriendsError } = await supabase
      .from('Friend')
      .select('user_id')
      .eq('friend_id', userId)
      .eq('status', 'ACCEPTED');

    if (reverseFriendsError) {
      console.error('Reverse friends error:', reverseFriendsError);
    } else {
      const reverseFriendIds = reverseFriends?.map(f => f.user_id) || [];
      friendIds.push(...reverseFriendIds);
    }

    // 2️⃣ Fetch posts: self + friends
    let query = supabase
      .from('Post')
      .select(`
        *,
        User!inner(id, name)
      `)
      .order('created_at', { ascending: false });

    if (friendIds.length > 0) {
      // Include posts from user and friends
      const userIds = [userId, ...friendIds];
      query = query.in('user_id', userIds);
    } else {
      // Only user's own posts
      query = query.eq('user_id', userId);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      console.error("Posts error:", postsError);
      return NextResponse.json([], { status: 500 });
    }

    // 3️⃣ Normalize the data
    const normalized = posts.map(post => ({
      id: post.id,
      content: post.caption,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      createdAt: post.createdat,
      user: post.User,
      likesCount: post.likes ? post.likes.length : 0,
      isLikedByMe: post.likes ? post.likes.includes(userId) : false,
      commentCount: 0, // No comments in simplified schema
    }));

    return NextResponse.json(normalized, { status: 200 });

  } catch (err) {
    console.error("FEED ERROR:", err);
    return NextResponse.json([], { status: 500 });
  }
}
