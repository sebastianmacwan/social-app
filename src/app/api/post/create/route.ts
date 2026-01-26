// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { getCurrentUserId } from "@/lib/auth";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();

//     // ✅ FIX: await is REQUIRED
//     const userId = await getCurrentUserId();

//     // 🔐 AUTH GUARD
//     if (!userId) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     const friendsCount = await prisma.friend.count({
//       where: {
//         OR: [
//           { userId },
//           { friendId: userId }
//         ],
//       },
//     });

//     if (friendsCount === 0) {
//       return NextResponse.json(
//         { error: "You must have at least 1 friend to post" },
//         { status: 403 }
//       );
//     }

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const todayPostCount = await prisma.post.count({
//       where: {
//         userId,
//         createdAt: { gte: today },
//       },
//     });

//     if (friendsCount < 10 && todayPostCount >= friendsCount) {
//       return NextResponse.json(
//         { error: "Daily post limit reached" },
//         { status: 403 }
//       );
//     }

//     const post = await prisma.post.create({
//       data: {
//         content: body.content,
//         mediaUrl: body.mediaUrl,
//         mediaType: body.mediaType,
//         userId,
//       },
//     });

//     return NextResponse.json(post, { status: 201 });

//   } catch (error) {
//     console.error("CREATE POST ERROR:", error);
//     return NextResponse.json(
//       { error: "Failed to create post" },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import supabase from "@/lib/prisma";
import { addPoints } from "@/lib/rewards";

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

    // Get friends count from Friend table
    const { count: friendsCount, error: friendsError } = await supabase
      .from('Friend')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('status', 'ACCEPTED');

    if (friendsError) {
      console.error('Friends count error:', friendsError);
      return NextResponse.json(
        { error: "Failed to check friends" },
        { status: 500 }
      );
    }

    const acceptedFriendsCount = friendsCount || 0;

    // Also count reverse friendships (where user is the friendId)
    const { count: reverseFriendsCount, error: reverseFriendsError } = await supabase
      .from('Friend')
      .select('*', { count: 'exact', head: true })
      .eq('friend_id', userId)
      .eq('status', 'ACCEPTED');

    if (reverseFriendsError) {
      console.error('Reverse friends count error:', reverseFriendsError);
    }

    const totalFriendsCount = acceptedFriendsCount + (reverseFriendsCount || 0);

    // Calculate allowed posts per day based on friends
    const allowedPostsPerDay = totalFriendsCount > 10 ? Infinity : totalFriendsCount;

    if (allowedPostsPerDay === 0) {
      return NextResponse.json(
        { error: "Add at least one friend to post" },
        { status: 403 }
      );
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count today's posts
    const { count: todayPostCount, error: countError } = await supabase
      .from("Post")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", today.toISOString());

    if (countError) {
      console.error("COUNT ERROR:", countError);
    }

    const postCount = todayPostCount || 0;

    if (allowedPostsPerDay !== Infinity && postCount >= allowedPostsPerDay) {
      return NextResponse.json(
        { error: "Daily post limit reached" },
        { status: 403 }
      );
    }

    // TEMP: Disable daily limit check for debugging
    // if (friendsCount < 10 && postCount >= friendsCount) {
    //   return NextResponse.json(
    //     { error: "Daily post limit reached" },
    //     { status: 403 }
    //   );
    // }

    // Create post
    console.log("POST CREATE: Creating post with data:", {
      userId: userId,
      content: body.content,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType,
    });
    // Prepare insert data
    const insertData: any = {
      user_id: userId,
      content: body.content,
    };

    if (body.mediaUrl) insertData.media_url = body.mediaUrl;
    if (body.mediaType) insertData.media_type = body.mediaType;

    const { error: postError } = await supabase
      .from("Post")
      .insert(insertData);

    if (postError) {
      console.error("CREATE POST ERROR:", postError);
      return NextResponse.json(
        { error: `Failed to create post: ${postError.message}` },
        { status: 500 }
      );
    }

    // Create a mock post object for the frontend
    const mockPost = {
      id: `temp-${Date.now()}`, // Temporary ID
      content: body.content,
      mediaUrl: body.mediaUrl || null,
      mediaType: body.mediaType || null,
      createdAt: new Date().toISOString(),
      likes: [],
      likesCount: 0,
      likedByMe: false,
    };

    // Award 5 points for creating a post
    try {
      await addPoints(userId, 5, "Created a post");
    } catch (pointsError) {
      console.error("Failed to award points:", pointsError);
    }

    return NextResponse.json(mockPost, { status: 201 });

  } catch (err) {
    console.error("CREATE POST ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
