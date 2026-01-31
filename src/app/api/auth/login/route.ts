import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { sendOTP } from "@/lib/email";
import bcrypt from "bcryptjs";

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
  let ip = req.headers.get("x-forwarded-for") ||
         req.headers.get("x-real-ip") ||
         "127.0.0.1";
  
  // Normalize IPv6 loopback to IPv4
  if (ip === "::1") ip = "127.0.0.1";
  
  // If x-forwarded-for contains multiple IPs, take the first one
  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }
  
  return ip;
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

    // Check for mobile time restriction (10 AM - 1 PM IST)
    if (deviceInfo.device === "Mobile") {
      const now = new Date();
      // IST Offset: UTC+5:30
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const hourIST = istTime.getUTCHours();
      
      // 10 AM to 1 PM IST (10:00 to 12:59)
      if (hourIST < 10 || hourIST > 12) {
        return NextResponse.json({ message: "Mobile access allowed only between 10 AM to 1 PM IST" }, { status: 403 });
      }
    }

    // Find user
    const { data: user, error: searchError } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .single();

    if (searchError || !user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // Check password (support legacy plaintext during migration)
    const stored = String(user.password || "");
    const looksHashed = stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");
    const isValidPassword = looksHashed ? await bcrypt.compare(password, stored) : password === stored;
    if (!isValidPassword) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // Browser-specific authentication
    if (deviceInfo.browser === "Chrome") {
      // Require OTP for Chrome
      if (!otp) {
        // Generate and send OTP
        const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        // Store OTP in OTP table
        // Note: OTP table columns mapped in Prisma: userId -> user_id, expiresAt -> expires_at
        const otpData = {
          user_id: user.id,
          otp: generatedOTP,
          type: 'login',
          expires_at: otpExpiry.toISOString(),
        };

        let { error: otpInsertError } = await supabase.from('OTP').insert(otpData);

        if (otpInsertError && otpInsertError.code === 'PGRST205') {
          console.log("OTP table not found, trying 'otp'...");
          const { error: altOtpError } = await supabase.from('otp').insert(otpData);
          if (altOtpError && altOtpError.code === 'PGRST205') {
            console.log("otp table not found, trying 'otps'...");
            await supabase.from('otps').insert(otpData);
          }
        }

        // Send OTP via email
        try {
          await sendOTP(user.email, generatedOTP, 'login');
          return NextResponse.json({ 
            message: "OTP sent to email. Please enter OTP to login.", 
            requiresOtp: true 
          });
        } catch (emailError) {
          console.error("Failed to send OTP email:", emailError);
          return NextResponse.json({ message: "Failed to send OTP" }, { status: 500 });
        }
      } else {
        // Verify OTP
        const otpString = String(otp).trim();
        console.log(`Verifying OTP for user ${user.id}: ${otpString}`);
        
        let { data: otpRecord, error: otpError } = await supabase
          .from('OTP')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'login')
          .eq('otp', otpString)
          .gt('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (otpError && otpError.code === 'PGRST205') {
          console.log("OTP table not found, trying 'otp'...");
          const { data: altOtp, error: altOtpError } = await supabase
            .from('otp')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'login')
            .eq('otp', otpString)
            .gt('expires_at', new Date().toISOString())
            .order('expires_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (altOtpError && altOtpError.code === 'PGRST205') {
            console.log("otp table not found, trying 'otps'...");
            const { data: pluralOtp, error: pluralOtpError } = await supabase
              .from('otps')
              .select('*')
              .eq('user_id', user.id)
              .eq('type', 'login')
              .eq('otp', otpString)
              .gt('expires_at', new Date().toISOString())
              .order('expires_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            otpRecord = pluralOtp;
            otpError = pluralOtpError;
          } else {
            otpRecord = altOtp;
            otpError = altOtpError;
          }
        }

        if (otpError) {
            console.error("OTP Query Error:", otpError);
        }
        
        if (!otpRecord) {
          console.log("OTP not found or expired");
          return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 401 });
        }

        console.log("OTP Verified successfully");

        // Delete used OTP
        const { error: deleteError } = await supabase.from('OTP').delete().eq('id', otpRecord.id);
        if (deleteError && deleteError.code === 'PGRST205') {
          const { error: altDeleteError } = await supabase.from('otp').delete().eq('id', otpRecord.id);
          if (altDeleteError && altDeleteError.code === 'PGRST205') {
            await supabase.from('otps').delete().eq('id', otpRecord.id);
          }
        }
      }
    }

    // 7️⃣ Record Login History with Fallbacks
    const recordLoginHistory = async () => {
      const loginHistoryData = {
        userId: user.id,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        deviceType: deviceInfo.device,
        ipAddress: ipAddress,
        timestamp: new Date().toISOString(),
      };

      console.log("📝 Attempting to record login history for user:", user.id);

      // Try different table names and column styles
      const tryInsert = async (tableName: string) => {
        console.log(`Trying insert into table: ${tableName}`);
        let { error } = await supabase.from(tableName).insert(loginHistoryData);
        
        // If column doesn't exist (42703), try snake_case or different names
        if (error && error.code === '42703') {
          console.log(`Column mismatch in ${tableName}, trying snake_case...`);
          const snakeData = {
            user_id: user.id,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            device_type: deviceInfo.device,
            ip_address: ipAddress,
            timestamp: new Date().toISOString(),
          };
          return await supabase.from(tableName).insert(snakeData);
        }
        return { error };
      };

      let result = await tryInsert('LoginHistory');

      if (result.error && result.error.code === 'PGRST205') {
        result = await tryInsert('login_history');
        if (result.error && result.error.code === 'PGRST205') {
          result = await tryInsert('Login_History');
        }
      }

      if (result.error) {
        console.error("❌ Login History Recording Failed:", result.error);
      } else {
        console.log("✅ Login History recorded successfully.");
      }
    };

    // Run in background
    recordLoginHistory().catch(err => console.error("Login History Error:", err));

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points,
        preferredLanguage: user.preferredLanguage || "en"
      },
    });

    const host = req.headers.get("host") || "";
    const domain = host.startsWith("localhost") ? undefined : host.split(":")[0];

    response.cookies.set("userId", String(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      domain,
    });

    return response;

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
