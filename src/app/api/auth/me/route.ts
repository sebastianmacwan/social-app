import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json(null, { status: 401 });
  }

  const { data: user, error } = await supabase
    .from('User')
    .select('id, name, email, points, preferredLanguage')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(user);
}
