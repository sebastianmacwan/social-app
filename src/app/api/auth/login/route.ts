// import { NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import prisma from "@/lib/prisma";

// export async function POST(req: Request) {
//   try {
//     const { email, password } = await req.json();

//     if (!email || !password) {
//       return NextResponse.json(
//         { message: "Email and password are required" },
//         { status: 400 }
//       );
//     }

//     // ✅ Find user
//     const user = await prisma.user.findUnique({
//       where: { email },
//     });

//     if (!user) {
//       return NextResponse.json(
//         { message: "Invalid email or password" },
//         { status: 401 }
//       );
//     }

//     // ✅ Compare hashed password
//     const isPasswordValid = await bcrypt.compare(password, user.password);

//     if (!isPasswordValid) {
//       return NextResponse.json(
//         { message: "Invalid email or password" },
//         { status: 401 }
//       );
//     }

//    const res = NextResponse.json({ message: "Login successful" });

// res.cookies.set("userId", String(user.id), {
//   httpOnly: true,
//   sameSite: "lax",
//   path: "/",
// });

// return res;


//   } catch (error) {
//     console.error("Login error:", error);
//     return NextResponse.json(
//       { message: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import supabase from "@/lib/prisma"; // renamed to supabase
import { sendOTP } from "@/lib/email";

function getDeviceInfo(userAgent: string) {
  const ua = userAgent.toLowerCase();

  return {
    browser: ua.includes("chrome") && !ua.includes("edg")
      ? "Chrome"
      : ua.includes("edg")
      ? "Edge"
      : ua.includes("firefox")
      ? "Firefox"
      : ua.includes("safari")
      ? "Safari"
      : "Unknown",

    os: ua.includes("windows")
      ? "Windows"
      : ua.includes("android")
      ? "Android"
      : ua.includes("iphone")
      ? "iOS"
      : ua.includes("mac")
      ? "MacOS"
      : "Unknown",

    device: ua.includes("mobile") ? "Mobile" : "Desktop",
  };
}

function getClientIP(req: Request): string {
  // Get IP from headers (in production, use proper IP detection)
  return req.headers.get("x-forwarded-for") ||
         req.headers.get("x-real-ip") ||
         "127.0.0.1";
}

export async function POST(req: Request) {
  try {
    let { email, password, otp } = await req.json();
    email = email.toLowerCase().trim();
    password = password.trim();
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || "unknown";
    const deviceInfo = getDeviceInfo(userAgent);
    const ipAddress = getClientIP(req);

    console.log("UserAgent:", userAgent);
    console.log("DeviceInfo:", deviceInfo);
    console.log("IP:", ipAddress);

    // Check for mobile time restriction
    if (deviceInfo.device === "Mobile") {
      const hourIST = Number(
        new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          hour12: false,
        })
      );
      if (hourIST < 10 || hourIST > 13) { // 10 AM to 1 PM
        return NextResponse.json({ message: "Mobile access allowed only between 10 AM to 1 PM IST" }, { status: 403 });
      }
    }

    // Check if user exists in our User table
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, email, password')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // Check password
    const bcrypt = (await import("bcryptjs")).default;
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const userId = user.id;

    // Browser-specific authentication
    if (deviceInfo.browser === "Chrome") {
      // Require OTP for Chrome
      if (!otp) {
        // Generate and send OTP
        const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in global store (like other OTP APIs)
        globalThis.__loginOtpStore = {
          otp: generatedOTP,
          userId: userId,
          expires: Date.now() + 5 * 60 * 1000, // 5 minutes
        };

        // Send OTP via email
        try {
          await sendOTP(email, generatedOTP, 'login');
        } catch (error) {
          console.error("Failed to send OTP:", error);
          return NextResponse.json({ message: "Failed to send OTP" }, { status: 500 });
        }

        return NextResponse.json({
          message: "OTP sent to your email",
          requiresOtp: true
        });
      }

      // Verify OTP
      const store = globalThis.__loginOtpStore;
      if (!store || store.otp !== otp.trim() || Date.now() > store.expires || store.userId !== userId) {
        return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 401 });
      }

      // Clear the OTP store
      delete globalThis.__loginOtpStore;
    }
    // Microsoft browsers (Edge) don't require additional authentication

    // Store login history
    const loginHistoryEntry = {
      userId,
      ip: ipAddress,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      device: deviceInfo.device,
      isSuspicious: false, // Could implement suspicious login detection
    };

    await supabase
      .from("LoginHistory")
      .insert(loginHistoryEntry);

    const res = NextResponse.json({ message: "Login successful" });
    res.cookies.set("userId", userId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
