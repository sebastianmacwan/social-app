import { getCurrentUserId } from "@/lib/auth";
import supabase from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const userId = await getCurrentUserId();

  try {
    // Fetch posts
    const { data: posts, error: postsError } = await supabase
      .from("Post")
      .select("id, content, media_url, media_type, created_at, user_id")
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Posts error:", postsError);
      return NextResponse.json({ error: postsError.message }, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json([]);
    }

    const postIds = posts.map(p => p.id);
    const userIds = Array.from(new Set(posts.map(p => p.user_id)));

    // Fetch users
    const { data: users, error: usersError } = await supabase
      .from("User")
      .select("id, name")
      .in("id", userIds);

    if (usersError) {
      console.error("Users error:", usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const userMap = new Map(users.map(u => [u.id, u.name]));

    // Fetch likes count
    const { data: likesData, error: likesError } = await supabase
      .from("Like")
      .select("post_id")
      .in("post_id", postIds);

    if (likesError) {
      console.error("Likes error:", likesError);
      return NextResponse.json({ error: likesError.message }, { status: 500 });
    }

    const likesCountMap = new Map();
    likesData.forEach(like => {
      likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) || 0) + 1);
    });

    // Fetch liked by me
    let likedByMeMap = new Map();
    if (userId) {
      const { data: myLikes, error: myLikesError } = await supabase
        .from("Like")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds);

      if (myLikesError) {
        console.error("My likes error:", myLikesError);
        return NextResponse.json({ error: myLikesError.message }, { status: 500 });
      }

      myLikes.forEach(like => likedByMeMap.set(like.post_id, true));
    }

    // Fetch comments
    const { data: commentsData, error: commentsError } = await supabase
      .from("Comment")
      .select("id, content, created_at, user_id, post_id")
      .in("post_id", postIds)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("Comments error:", commentsError);
      return NextResponse.json({ error: commentsError.message }, { status: 500 });
    }

    const commentUserIds = Array.from(new Set(commentsData.map(c => c.user_id)));
    const { data: commentUsers, error: commentUsersError } = await supabase
      .from("User")
      .select("id, name")
      .in("id", commentUserIds);

    if (commentUsersError) {
      console.error("Comment users error:", commentUsersError);
      return NextResponse.json({ error: commentUsersError.message }, { status: 500 });
    }

    const commentUserMap = new Map(commentUsers.map(u => [u.id, u.name]));

    const commentsMap = new Map();
    commentsData.forEach(comment => {
      if (!commentsMap.has(comment.post_id)) {
        commentsMap.set(comment.post_id, []);
      }
      commentsMap.get(comment.post_id).push({
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        author: commentUserMap.get(comment.user_id) || 'Unknown',
      });
    });

    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      createdAt: post.created_at,
      mediaUrl: post.media_url,
      mediaType: post.media_type,
      author: userMap.get(post.user_id) || 'Unknown',
      likesCount: likesCountMap.get(post.id) || 0,
      likedByMe: likedByMeMap.get(post.id) || false,
      comments: commentsMap.get(post.id) || [],
    }));

    return NextResponse.json(formattedPosts);
  } catch (err) {
    console.error("Feed error:", err);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
