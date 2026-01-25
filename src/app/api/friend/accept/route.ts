import { NextResponse } from "next/server";
import supabase from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

// export async function POST(req: Request) {
//   const userId = await getCurrentUserId();
//   if (!userId) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const { friendId } = await req.json();

//   if (!friendId) {
//     return NextResponse.json({ error: "Friend ID required" }, { status: 400 });
//   }

//   // Find the pending friend request where the current user is the friendId
//   const { data: friendRequest, error: findError } = await supabase
//     .from('Friend')
//     .select('id')
//     .eq('userid', friendId)
//     .eq('friendid', userId)
//     .eq('status', 'PENDING')
//     .single();

//   if (findError || !friendRequest) {
//     return NextResponse.json({ error: "No pending friend request found" }, { status: 404 });
//   }

//   // Update the status to ACCEPTED
//   const { error: updateError } = await supabase
//     .from('Friend')
//     .update({ status: 'ACCEPTED' })
//     .eq('id', friendRequest.id);

//   if (updateError) {
//     console.error("Update error:", updateError);
//     return NextResponse.json({ error: "Failed to accept friend request" }, { status: 500 });
//   }

//   return NextResponse.json({ success: true });
// }


export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const requestId = body.requestId;

  if (!requestId) {
    return NextResponse.json({ error: "Request ID required" }, { status: 400 });
  }

  // First verify that this pending request belongs to the current user
  const { data: friendRequest } = await supabase
    .from("Friend")
    .select("id")
    .eq("id", requestId)
    .eq("friend_id", userId)
    .eq("status", "PENDING")
    .single();

  if (!friendRequest) {
    return NextResponse.json(
      { error: "No pending friend request found" },
      { status: 404 }
    );
  }

  await supabase
    .from("Friend")
    .update({ status: "ACCEPTED" })
    .eq("id", requestId);

  return NextResponse.json({ success: true });
}
