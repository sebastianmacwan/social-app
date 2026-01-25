import { NextResponse } from "next/server";
import supabase from "@/lib/prisma"; // renamed to supabase
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  try {
    let { name, email, password } = await req.json();
    email = email.toLowerCase().trim();
    password = password.trim();

    // ✅ Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    // ✅ Sign up with Supabase auth
    // Temporarily disabled due to rate limits - using direct insert for development
    // const { data, error } = await supabase.auth.signUp({
    //   email,
    //   password,
    // });

    // if (error) {
    //   return NextResponse.json(
    //     { message: error.message },
    //     { status: 400 }
    //   );
    // }

    // const userId = data.user?.id;
    // Temporary: generate a UUID for development
    const userId = uuidv4();

    // Hash the password
    const hashedPassword = await hashPassword(password);

    if (userId) {
      // ✅ Insert into custom User table
      const { error: insertError } = await supabase
        .from('User')
        .insert({
          id: userId,
          name,
          email,
          password: hashedPassword,
          points: 0,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        return NextResponse.json(
          { message: "Failed to create user profile" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: "Signup successful" },
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
