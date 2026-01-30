import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/lib/auth";
import { addPoints } from "@/lib/rewards";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch post to verify ownership and get author ID
  const { data: post, error: fetchError } = await supabase
    .from("Post")
    .select("user_id")
    .eq("id", params.id)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // 2. Verify ownership
  if (post.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Delete post
  const { error } = await supabase
    .from("Post")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }

  // 4. Deduct reward points (reverse the +5 for creating a post)
  try {
    await addPoints(userId, -5, "Post deleted");
  } catch (pointsError) {
    console.error("Failed to deduct points:", pointsError);
  }

  return NextResponse.json({ success: true });
}
