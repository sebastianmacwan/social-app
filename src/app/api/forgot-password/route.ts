import { NextResponse } from "next/server";
import supabase from "@/lib/prisma";
import { sendPasswordReset } from "@/lib/email";
import { generatePassword, hashPassword } from "@/lib/password";

// In-memory store for daily reset tracking (in production, use Redis/database)
const dailyResets = new Map<string, Date>();

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
    let user;
    if (email) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      user = data;
    } else if (phone) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('phone', phone)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      user = data;
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const userKey = email || phone!;
    const lastReset = dailyResets.get(userKey);

    if (lastReset && lastReset >= today) {
      return NextResponse.json(
        { error: "You can reset password only once per day" },
        { status: 429 }
      );
    }

    // Generate new password
    const newPassword = generatePassword();
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', user.id);

    if (updateError) {
      console.error("Update password error:", updateError);
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }

    // Send email with new password
    if (email) {
      await sendPasswordReset(email, newPassword);
    } else if (phone) {
      // For phone, perhaps send SMS, but for now log
      console.log(`📱 PASSWORD RESET sent to ${phone}: ${newPassword}`);
    }

    // Update the daily reset tracking
    dailyResets.set(userKey, new Date());

    // Clean up old entries (older than 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    for (const [key, date] of Array.from(dailyResets.entries())) {
      if (date < yesterday) {
        dailyResets.delete(key);
      }
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