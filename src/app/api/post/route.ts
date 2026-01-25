import { NextResponse } from "next/server";
import supabase from "@/lib/prisma";
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

    // 1️⃣ Get user's subscription plan
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('subscription_plan')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error("User error:", userError);
      return NextResponse.json({ error: "Failed to get user data" }, { status: 500 });
    }

    const dailyLimit = getDailyPostLimit(userData.subscription_plan);

    // 2️⃣ Count today's posts
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todayPosts, error: countError } = await supabase
      .from('Post')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());

    if (countError) {
      console.error("Count error:", countError);
      return NextResponse.json({ error: "Failed to check daily limit" }, { status: 500 });
    }

    if ((todayPosts || 0) >= dailyLimit) {
      return NextResponse.json(
        { error: "Daily post limit reached" },
        { status: 429 }
      );
    }

    // 3️⃣ Create post
    const { data: post, error: postError } = await supabase
      .from('Post')
      .insert({
        user_id: userId,
        content: content,
        media_url: mediaUrl,
        media_type: mediaType,
      })
      .select()
      .single();

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
