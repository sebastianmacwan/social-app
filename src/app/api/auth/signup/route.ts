import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  try {
    let { name, email, password, phone } = await req.json();
    email = email.toLowerCase().trim();
    password = password.trim();

    // ✅ Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUsers, error: searchError } = await supabase
      .from('User')
      .select('id')
      .eq('email', email);

    if (searchError) {
      console.error("Supabase Search Error:", searchError);
      return NextResponse.json({ message: "Database error checking user" }, { status: 500 });
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { message: "User already exists with this email" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // ✅ Create User in Supabase
    // Note: Using quotes for column names to match CaseSensitive columns if created that way,
    // or standard snake_case if user followed SQL conventions. 
    // Based on previous Prisma schema, we expect 'subscription_plan' (mapped) and 'points'.
    const { data: newUser, error: createError } = await supabase
      .from('User')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          points: 0,
          subscription_plan: "FREE",
          "preferredLanguage": "en" // Quoted to match Prisma default expectation of mixed case
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error("Supabase Create Error:", createError);
      return NextResponse.json({ message: "Failed to create user: " + createError.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Signup successful", user: { id: newUser.id, email: newUser.email, name: newUser.name } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
