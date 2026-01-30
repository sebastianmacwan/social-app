import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 1. Count Friends
    // Count where user is sender (user_id) AND status is ACCEPTED
    const { count: sentFriends, error: sentError } = await supabase
      .from('Friend')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'ACCEPTED');

    if (sentError) throw sentError;

    // Count where user is receiver (friend_id) AND status is ACCEPTED
    const { count: receivedFriends, error: receivedError } = await supabase
      .from('Friend')
      .select('*', { count: 'exact', head: true })
      .eq('friend_id', userId)
      .eq('status', 'ACCEPTED');

    if (receivedError) throw receivedError;

    const totalFriends = (sentFriends || 0) + (receivedFriends || 0);

    // 2. Determine Daily Limit
    let dailyLimit = 0;
    if (totalFriends === 0) {
      dailyLimit = 0;
    } else if (totalFriends < 2) {
      // 1 friend -> 1 post
      dailyLimit = 1;
    } else if (totalFriends === 2) {
      // 2 friends -> 2 posts
      dailyLimit = 2;
    } else if (totalFriends > 10) {
      // > 10 friends -> Unlimited
      dailyLimit = Infinity;
    } else {
      // 3-10 friends -> 1 post (Default rule is 1 time a day unless specific cases met)
      dailyLimit = 1;
    }

    if (dailyLimit === 0) {
      return NextResponse.json(
        { error: "You need at least 1 friend to post on the public page." },
        { status: 403 }
      );
    }

    // 3. Check Today's Usage
    if (dailyLimit !== Infinity) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      const { count: postsToday, error: postsError } = await supabase
        .from('Post')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('createdAt', todayIso);

      if (postsError) throw postsError;

      if ((postsToday || 0) >= dailyLimit) {
        return NextResponse.json(
          { error: `Daily post limit reached. You can post ${dailyLimit} times a day with ${totalFriends} friends.` },
          { status: 403 }
        );
      }
    }

    // 4. Create Post
    const { data: post, error: createError } = await supabase
      .from('Post')
      .insert({
        content: body.content,
        media_url: body.mediaUrl,
        media_type: body.mediaType, // Expecting 'IMAGE' or 'VIDEO'
        user_id: userId,
      })
      .select(`
        *,
        author:User (
          name,
          email
        )
      `)
      .single();

    if (createError) {
      console.error("Post Create Error:", createError);
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }

    return NextResponse.json(post, { status: 201 });

  } catch (error) {
    console.error("CREATE POST ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
