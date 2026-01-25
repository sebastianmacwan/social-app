// import { NextResponse } from "next/server";
// // import prisma from "@/lib/prisma";
// import { getCurrentUserId } from "@/lib/auth";
// import { addPoints } from "@/lib/rewards";
// import supabase from "@/lib/prisma";

// export async function POST(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const postId = params.id; // Keep as string for Supabase
//     const userId = await getCurrentUserId();

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Get current post
//     const { data: post, error: fetchError } = await supabase
//       .from("Post")
//       .select("likes, userId")
//       .eq("id", postId)
//       .single();

//     if (fetchError || !post) {
//       return NextResponse.json({ error: "Post not found" }, { status: 404 });
//     }

//     const likes = post.likes || [];
//     const userIdStr = userId.toString();
//     const isLiked = likes.includes(userIdStr);
//     let newLikes: string[];

//     if (isLiked) {
//       // UNLIKE
//       newLikes = likes.filter(id => id !== userIdStr);
//     } else {
//       // LIKE
//       newLikes = [...likes, userIdStr];
//     }

//     // Update the post
//     const { error: updateError } = await supabase
//       .from("Post")
//       .update({ likes: newLikes })
//       .eq("id", postId);

//     if (updateError) {
//       return NextResponse.json({ error: "Failed to update like" }, { status: 500 });
//     }

//     // Reward system for likes
//     if (!isLiked && newLikes.length === 5) {
//       // First 5 likes: +5 points to post author
//       await addPoints(post.userId, 5, "Post reached 5 likes");
//     } else if (isLiked && newLikes.length === 4) {
//       // Unliked from 5 to 4: -5 points from post author
//       await addPoints(post.userId, -5, "Post lost a like (from 5 to 4)");
//     }

//     return NextResponse.json({
//       postId,
//       liked: !isLiked,
//       likesCount: newLikes.length,
//     });
//   } catch (err) {
//     console.error("LIKE ERROR:", err);
//     return NextResponse.json(
//       { error: "Failed to toggle like" },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import supabase from "@/lib/prisma";

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

    // 1. Check if already liked
    const { data: existingLike } = await supabase
      .from("Like")
      .select("id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .maybeSingle();

    if (existingLike) {
      // 2. Unlike
      await supabase
        .from("Like")
        .delete()
        .eq("id", existingLike.id);
    } else {
      // 3. Like
      await supabase.from("Like").insert({
        user_id: userId,
        post_id: postId,
      });
    }

    // 4. Get updated count
    const { count } = await supabase
      .from("like")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

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
