import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/lib/auth";
import { addPoints } from "@/lib/rewards";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await req.json();
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const postId = params.id;

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from("Post")
      .select("id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Create comment - trying different table names and column styles
    const tryInsertComment = async (tableName: string) => {
      // Try with snake_case
      const snakeData = {
        post_id: postId,
        user_id: userId,
        content,
      };
      
      let { data, error } = await supabase
        .from(tableName)
        .insert(snakeData)
        .select()
        .single();

      // If snake_case fails with undefined column, try camelCase
      if (error && error.code === '42703') {
        const camelData = {
          postId: postId,
          authorId: userId,
          content,
        };
        const { data: altData, error: altError } = await supabase
          .from(tableName)
          .insert(camelData)
          .select()
          .single();
        
        // If that also fails, try a mix (postId/userId)
        if (altError && altError.code === '42703') {
          const mixData = {
            postId: postId,
            userId: userId,
            content,
          };
          return await supabase
            .from(tableName)
            .insert(mixData)
            .select()
            .single();
        }
        return { data: altData, error: altError };
      }

      return { data, error };
    };

    let { data: comment, error: commentError } = await tryInsertComment("Comment");

    if (commentError && commentError.code === 'PGRST205') {
      const { data: d2, error: e2 } = await tryInsertComment("comment");
      if (e2 && e2.code === 'PGRST205') {
        const { data: d3, error: e3 } = await tryInsertComment("comments");
        comment = d3;
        commentError = e3;
      } else {
        comment = d2;
        commentError = e2;
      }
    }

    if (commentError) {
      if (commentError.code === 'PGRST205') {
        console.error("Comment table missing in Supabase");
        return NextResponse.json({ error: "Commenting is currently unavailable as the comments table does not exist." }, { status: 404 });
      }
      console.error("Comment error:", commentError);
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    // Award 5 points for answering (commenting)
    await addPoints(userId, 5, "Answered a question");

    return NextResponse.json(comment);
  } catch (err) {
    console.error("COMMENT CREATE ERROR:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}


  