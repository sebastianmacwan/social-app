import { NextResponse } from "next/server";
import supabase from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { friendId } = await req.json();

    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!friendId || friendId === userId) {
      return NextResponse.json(
        { error: "Invalid friend" },
        { status: 400 }
      );
    }

    // Check if friend exists
    const { data: friend, error: friendError } = await supabase
      .from('User')
      .select('id')
      .eq('id', friendId)
      .single();

    if (friendError || !friend) {
      return NextResponse.json(
        { error: "User does not exist" },
        { status: 404 }
      );
    }

    // Check if friend request already exists (in either direction)
    const { data: existingRequest, error: checkError } = await supabase
      .from('Friend')
      .select('id, status')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("Check error:", checkError);
      return NextResponse.json({ error: "Failed to check friend status" }, { status: 500 });
    }

    if (existingRequest) {
      if (existingRequest.status === 'ACCEPTED') {
        return NextResponse.json(
          { error: "Already friends" },
          { status: 400 }
        );
      } else if (existingRequest.status === 'PENDING') {
        return NextResponse.json(
          { error: "Friend request already sent" },
          { status: 400 }
        );
      }
    }

    // Create friend request
    const { error: insertError } = await supabase
      .from('Friend')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'PENDING'
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADD FRIEND ERROR:", error);
    return NextResponse.json(
      { error: "Failed to add friend" },
      { status: 500 }
    );
  }
}
