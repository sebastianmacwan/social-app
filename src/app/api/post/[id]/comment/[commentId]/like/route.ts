import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/lib/auth";
import { addPoints } from "@/lib/rewards";

export async function POST(
  req: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const commentId = params.commentId;

    // Check if comment exists - trying different table names
    const tryFetchComment = async (tableName: string) => {
      let result: any;
      
      result = await supabase
        .from(tableName)
        .select("id, user_id")
        .eq("id", commentId)
        .single();
      
      if (result.error && (result.error.code === '42703' || result.error.message?.includes('user_id'))) {
        result = await supabase
          .from(tableName)
          .select("id, authorId")
          .eq("id", commentId)
          .single();
      }
      return { data: result.data, error: result.error };
    };

    let { data: comment, error: commentError } = await tryFetchComment("Comment");
    if (commentError && commentError.code === 'PGRST205') {
      const { data: d2, error: e2 } = await tryFetchComment("comment");
      if (e2 && e2.code === 'PGRST205') {
        const { data: d3, error: e3 } = await tryFetchComment("comments");
        comment = d3;
        commentError = e3;
      } else {
        comment = d2;
        commentError = e2;
      }
    }

    if (commentError || !comment) {
      if (commentError && commentError.code === 'PGRST205') {
        return NextResponse.json({ error: "Commenting and likes are currently unavailable as the comments table does not exist." }, { status: 404 });
      }
      console.error("Comment fetch error:", commentError);
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Normalized user_id
    const commentAuthorId = comment.user_id || comment.authorId || comment.author_id;

    // Check if already liked - trying different junction table names
    const tryFetchLike = async (tableName: string) => {
      let result: any;

      // Try snake_case columns
      result = await supabase
        .from(tableName)
        .select("id")
        .eq("comment_id", commentId)
        .eq("user_id", userId)
        .maybeSingle();
      
      // Try camelCase if undefined column
      if (result.error && result.error.code === '42703') {
        result = await supabase
          .from(tableName)
          .select("id")
          .eq("commentId", commentId)
          .eq("userId", userId)
          .maybeSingle();
      }
      return { data: result.data, error: result.error };
    };

    let { data: existingLike, error: likeError } = await tryFetchLike("CommentLike");
    if (likeError && likeError.code === 'PGRST205') {
      const { data: d2, error: e2 } = await tryFetchLike("comment_like");
      if (e2 && e2.code === 'PGRST205') {
        const { data: d3, error: e3 } = await tryFetchLike("comment_likes");
        existingLike = d3;
        likeError = e3;
      } else {
        existingLike = d2;
        likeError = e2;
      }
    }

    if (existingLike) {
      return NextResponse.json({ error: "Already liked" }, { status: 400 });
    }

    // Add like - trying different table and column styles
    const tryInsertLike = async (tableName: string) => {
      // Try snake_case
      const { error } = await supabase
        .from(tableName)
        .insert({
          comment_id: commentId,
          user_id: userId,
        });
      
      if (error && error.code === '42703') {
        // Try camelCase
        return await supabase
          .from(tableName)
          .insert({
            commentId: commentId,
            userId: userId,
          });
      }
      return { error };
    };

    let targetLikeTable = "CommentLike";
    let { error: insertError } = await tryInsertLike("CommentLike");
    if (insertError && insertError.code === 'PGRST205') {
      const { error: e2 } = await tryInsertLike("comment_like");
      if (e2 && e2.code === 'PGRST205') {
        const { error: e3 } = await tryInsertLike("comment_likes");
        insertError = e3;
        if (!e3) targetLikeTable = "comment_likes";
      } else {
        insertError = e2;
        if (!e2) targetLikeTable = "comment_like";
      }
    }

    if (insertError) {
      console.error("Like error:", insertError);
      return NextResponse.json({ error: "Failed to like comment" }, { status: 500 });
    }

    // Get updated count
    const { count, error: countError } = await supabase
      .from(targetLikeTable)
      .select("*", { count: "exact", head: true })
      .or(`comment_id.eq.${commentId},commentId.eq.${commentId}`);

    // Award points if reaches 5 likes
    if (count === 5 && commentAuthorId) {
      await addPoints(commentAuthorId, 5, "Answer received 5 upvotes");
    }

    return NextResponse.json({ likesCount: count ?? 0 });
  } catch (err) {
    console.error("COMMENT LIKE ERROR:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const commentId = params.commentId;

  // Remove like - trying different table and column names
  const tryDeleteLike = async (tableName: string) => {
    // Try snake_case
    let { error } = await supabase
      .from(tableName)
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId);
    
    if (error && error.code === '42703') {
      // Try camelCase
      let { error: e2 } = await supabase
        .from(tableName)
        .delete()
        .eq("commentId", commentId)
        .eq("userId", userId);
      
      if (e2 && e2.code === '42703') {
        // Try all lowercase
        return await supabase
          .from(tableName)
          .delete()
          .eq("commentid", commentId)
          .eq("userid", userId);
      }
      return { error: e2 };
    }
    return { error };
  };

  let { error: deleteError } = await tryDeleteLike("CommentLike");
  if (deleteError && deleteError.code === 'PGRST205') {
    const { error: e2 } = await tryDeleteLike("comment_like");
    if (e2 && e2.code === 'PGRST205') {
      const { error: e3 } = await tryDeleteLike("comment_likes");
      deleteError = e3;
    } else {
      deleteError = e2;
    }
  }

  if (deleteError) {
    console.error("Unlike error:", deleteError);
    return NextResponse.json({ error: "Failed to unlike comment" }, { status: 500 });
  }

  // Update upvotes count
  const { data: comment } = await supabase
    .from("Comment")
    .select("upvotes, userid")
    .eq("id", commentId)
    .single();

  if (comment) {
    const newUpvotes = Math.max(0, (comment.upvotes || 0) - 1);
    await supabase
      .from("Comment")
      .update({ upvotes: newUpvotes })
      .eq("id", commentId);

    // If upvotes drop below 5, deduct points if previously awarded
    if (newUpvotes < 5) {
      // Check if previously had 5 or more
      // For simplicity, deduct 5 if now <5, but this is not accurate
      // Better to track if points were awarded
      // For now, skip or implement properly
    }
  }

  return NextResponse.json({ success: true });
}