// import { cookies } from "next/headers";
// import prisma from "@/lib/prisma";
// import { NextResponse } from "next/server";

// export async function GET() {
//     const userId = cookies().get("session_user_id")?.value;
//     if (!userId) return NextResponse.json(null);

//     const user = await prisma.user.findUnique({
//         where: { id: Number(userId) },
//         select: { id: true, name: true, email: true },
//     });

//     return NextResponse.json(user);
// }

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import supabase from "@/lib/prisma";

export async function GET() {
  const userId = cookies().get("userId")?.value;

  if (!userId) {
    return NextResponse.json(null, { status: 401 });
  }

  const { data: user, error } = await supabase
    .from('User')
    .select('id, name, email, points')
    .eq('id', userId)
    .single();


  if (error || !user) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(user);
}
