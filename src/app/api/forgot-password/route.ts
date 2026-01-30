import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { sendPasswordReset } from "@/lib/email";
import { generatePassword, hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  try {
    const { email, phone } = await req.json();

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400 }
      );
    }

    // Find user
    let userQuery = supabase.from('User').select('*');
    if (email) {
      userQuery = userQuery.eq('email', email);
    } else {
      userQuery = userQuery.eq('phone', phone);
    }
    
    const { data: user, error: userError } = await userQuery.single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (user.lastResetRequest) {
      const lastReset = new Date(user.lastResetRequest);
      if (lastReset >= today) {
        return NextResponse.json(
          { error: "Use only time" }, // "show warning message like use only time"
          { status: 429 }
        );
      }
    }

    // Generate new password
    const newPassword = generatePassword();
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and lastResetRequest
    const { error: updateError } = await supabase
      .from('User')
      .update({
        password: hashedPassword,
        lastResetRequest: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error("Update Password Error:", updateError);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    // Send email with new password
    if (user.email) {
      await sendPasswordReset(user.email, newPassword);
    } else if (phone) {
      // For phone, perhaps send SMS
      console.log(`📱 PASSWORD RESET sent to ${phone}: ${newPassword}`);
    }

    return NextResponse.json({
      message: "Password reset successful. Check your email or phone for the new password."
    });

  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
