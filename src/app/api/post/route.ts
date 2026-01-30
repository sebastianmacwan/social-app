import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/lib/auth";
import { getDailyPostLimit } from "@/lib/postRules";
import { addPoints } from "@/lib/rewards";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, mediaUrl, mediaType } = await req.json();

    // 1️⃣ Count Friends (ACCEPTED status)
    // Check both directions: user_id or friend_id
    let { count: sentFriends, error: sentError } = await supabase
      .from('Friend')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'ACCEPTED');

    if (sentError && sentError.code === 'PGRST205') {
      const { count: altSent } = await supabase
        .from('friend')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'ACCEPTED');
      sentFriends = altSent;
    }

    let { count: receivedFriends, error: receivedError } = await supabase
      .from('Friend')
      .select('*', { count: 'exact', head: true })
      .eq('friend_id', userId)
      .eq('status', 'ACCEPTED');

    if (receivedError && receivedError.code === 'PGRST205') {
      const { count: altReceived } = await supabase
        .from('friend')
        .select('*', { count: 'exact', head: true })
        .eq('friend_id', userId)
        .eq('status', 'ACCEPTED');
      receivedFriends = altReceived;
    }

    const totalFriends = (sentFriends || 0) + (receivedFriends || 0);

    // 2️⃣ Determine Daily Limit based on Friends
    let dailyLimit = 0;
    if (totalFriends === 0) {
      dailyLimit = 0;
    } else if (totalFriends === 1) {
      dailyLimit = 1;
    } else if (totalFriends === 2) {
      dailyLimit = 2;
    } else if (totalFriends > 10) {
      dailyLimit = Infinity;
    } else {
      // 3-10 friends
      dailyLimit = 1;
    }

    if (dailyLimit === 0) {
      return NextResponse.json(
        { error: "You need at least 1 friend to post on the public page." },
        { status: 403 }
      );
    }

    // 3️⃣ Count today's posts
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let { count: todayPosts, error: countError } = await supabase
      .from('Post')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());

    if (countError && countError.code === 'PGRST205') {
      const { count: altCount, error: altError } = await supabase
        .from('post')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());
      
      if (altError && altError.code === 'PGRST205') {
        const { count: pluralCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', today.toISOString());
        todayPosts = pluralCount;
      } else {
        todayPosts = altCount;
      }
    }

    if (dailyLimit !== Infinity && (todayPosts || 0) >= dailyLimit) {
      return NextResponse.json(
        { error: `Daily post limit reached. You can post ${dailyLimit} times with ${totalFriends} friends.` },
        { status: 403 }
      );
    }

    // 4️⃣ Create post
    const postData = {
      user_id: userId,
      content: content,
      media_url: mediaUrl,
      media_type: mediaType,
    };

    let { data: post, error: postError } = await supabase
      .from('Post')
      .insert(postData)
      .select()
      .single();

    if (postError && postError.code === 'PGRST205') {
      const { data: altPost, error: altError } = await supabase
        .from('post')
        .insert(postData)
        .select()
        .single();
      
      if (altError && altError.code === 'PGRST205') {
        const { data: pluralPost, error: pluralError } = await supabase
          .from('posts')
          .insert(postData)
          .select()
          .single();
        post = pluralPost;
        postError = pluralError;
      } else {
        post = altPost;
        postError = altError;
      }
    }

    if (postError) {
      console.error("Post error:", postError);
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }

    // 4️⃣ Reward points
    try {
      await addPoints(userId, 5, "Created a post");
    } catch (pointsError) {
      console.error("Failed to award points:", pointsError);
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("POST CREATE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
