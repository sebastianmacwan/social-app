import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
import supabase from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase
    .from("Post")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
