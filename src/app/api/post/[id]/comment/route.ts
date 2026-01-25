import { NextResponse } from "next/server";
import supabase from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { addPoints } from "@/lib/rewards";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  // Create comment
  const { data: comment, error: commentError } = await supabase
    .from("Comment")
    .insert({
      postId: postId,
      userId: userId,
      content,
    })
    .select()
    .single();

  if (commentError) {
    console.error("Comment error:", commentError);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }

  // Award 5 points for answering (commenting)
  await addPoints(userId, 5, "Answered a question");

  return NextResponse.json(comment, { status: 201 });
}


  