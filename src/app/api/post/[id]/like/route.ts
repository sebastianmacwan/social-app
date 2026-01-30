import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postId = params.id;

    // 1. Check if already liked - with fallbacks
    let result: any;
    
    result = await supabase
      .from("Like")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .maybeSingle();

    if (result.error && result.error.code === 'PGRST205') {
      console.log("Like table not found, trying 'like'...");
      result = await supabase
        .from("like")
        .select("id")
        .eq("user_id", userId)
        .eq("post_id", postId)
        .maybeSingle();
      
      if (result.error && result.error.code === 'PGRST205') {
        console.log("like table not found, trying 'likes'...");
        result = await supabase
          .from("likes")
          .select("id")
          .eq("user_id", userId)
          .eq("post_id", postId)
          .maybeSingle();
      }
    }

    let existingLike = result.data;
    let fetchError = result.error;

    if (fetchError) {
      console.error("Fetch like error:", fetchError);
      return NextResponse.json({ error: "Failed to check like status" }, { status: 500 });
    }

    if (existingLike) {
      // 2. UNLIKE: Remove from Like table
      let { error: deleteError } = await supabase
        .from("Like")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postId);

      if (deleteError && deleteError.code === 'PGRST205') {
        const { error: altDeleteError } = await supabase
          .from("like")
          .delete()
          .eq("user_id", userId)
          .eq("post_id", postId);
        
        if (altDeleteError && altDeleteError.code === 'PGRST205') {
          deleteError = (await supabase
            .from("likes")
            .delete()
            .eq("user_id", userId)
            .eq("post_id", postId)).error;
        } else {
          deleteError = altDeleteError;
        }
      }

      if (deleteError) {
        console.error("Delete like error:", deleteError);
        return NextResponse.json({ error: "Failed to unlike" }, { status: 500 });
      }
    } else {
      // 3. LIKE: Insert into Like table
      const likeData = {
        user_id: userId,
        post_id: postId
      };
      
      let { error: insertError } = await supabase
        .from("Like")
        .insert(likeData);

      if (insertError && insertError.code === 'PGRST205') {
        const { error: altInsertError } = await supabase
          .from("like")
          .insert(likeData);
        
        if (altInsertError && altInsertError.code === 'PGRST205') {
          insertError = (await supabase
            .from("likes")
            .insert(likeData)).error;
        } else {
          insertError = altInsertError;
        }
      }

      if (insertError) {
        console.error("Insert like error:", insertError);
        return NextResponse.json({ error: "Failed to like" }, { status: 500 });
      }
    }

    // 4. Get updated count
    let { count, error: countError } = await supabase
      .from("Like")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (countError && countError.code === 'PGRST205') {
      const { count: altCount, error: altCountError } = await supabase
        .from("like")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);
      
      if (altCountError && altCountError.code === 'PGRST205') {
        const { count: pluralCount, error: pluralCountError } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", postId);
        
        count = pluralCount;
        countError = pluralCountError;
      } else {
        count = altCount;
        countError = altCountError;
      }
    }

    if (countError) {
      console.error("Count error:", countError);
    }

    return NextResponse.json({
      liked: !existingLike,
      likesCount: count ?? 0,
    });
  } catch (err) {
    console.error("LIKE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
