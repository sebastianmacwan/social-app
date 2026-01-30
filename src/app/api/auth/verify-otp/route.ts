import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { otp } = await req.json();

    console.log("Verifying OTP:", otp);
    console.log("Store:", globalThis.__loginOtpStore);

    const store = globalThis.__loginOtpStore;
    if (!store || store.otp !== otp.trim() || Date.now() > store.expires) {
      return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
    }

    // 7️⃣ Record Login History with Fallbacks
    const recordLoginHistory = async () => {
      const loginHistoryData = {
        user_id: store.userId,
        browser: "Chrome",
        os: "Unknown",
        device_type: "Unknown",
        ip_address: "127.0.0.1",
        timestamp: new Date().toISOString(),
      };

      // Try different table names and column styles
      const tryInsert = async (tableName: string) => {
        // Try snake_case
        let { error } = await supabase.from(tableName).insert(loginHistoryData);
        
        // If column doesn't exist (42703), try camelCase or different names
        if (error && error.code === '42703') {
          const camelData = {
            userId: store.userId,
            browser: "Chrome",
            os: "Unknown",
            device: "Unknown",
            ip: "127.0.0.1",
            createdAt: new Date().toISOString(),
          };
          return await supabase.from(tableName).insert(camelData);
        }
        return { error };
      };

      let { error: historyError } = await tryInsert('LoginHistory');

      if (historyError && historyError.code === 'PGRST205') {
        const { error: e2 } = await tryInsert('login_history');
        if (e2 && e2.code === 'PGRST205') {
          await tryInsert('Login_History');
        }
      }
    };

    // Run in background
    recordLoginHistory().catch(err => console.error("Login History Error:", err));

    const res = NextResponse.json({ message: "Login successful" });
    res.cookies.set("userId", String(store.userId), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    // Clear store
    delete globalThis.__loginOtpStore;

    return res;
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
