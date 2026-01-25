import { NextResponse } from "next/server";
import supabase from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from('User')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("USER SEARCH ERROR:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}