import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json([], { status: 401 });
  }

  // Fetch real history from Supabase with fallbacks for table and column names
  const tryFetch = async (tableName: string) => {
    // Try user_id filter first
    let result = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', userId);

    // If column doesn't exist (42703), try userId filter
    if (result.error && result.error.code === '42703') {
      result = await supabase
        .from(tableName)
        .select('*')
        .eq('userId', userId);
    }
    return result;
  };

  let { data: rawHistory, error } = await tryFetch('LoginHistory');

  if (error && error.code === 'PGRST205') {
    const { data: altHistory, error: altError } = await tryFetch('login_history');
    if (altError && altError.code === 'PGRST205') {
      const { data: pluralHistory, error: pluralError } = await tryFetch('Login_History');
      rawHistory = pluralHistory;
      error = pluralError;
    } else {
      rawHistory = altHistory;
      error = altError;
    }
  }

  if (error) {
    console.error("Error fetching login history:", error);
    return NextResponse.json([], { status: 500 });
  }

  // Map database fields to UI fields and sort in-memory to handle inconsistent sorting columns
  const history = (rawHistory || [])
    .map((item: any) => ({
      id: item.id,
      ip: item.ip_address || item.ip || item.ipAddress || "",
      browser: item.browser || "",
      os: item.os || "",
      device: item.device_type || item.device || item.deviceType || "",
      createdAt: item.timestamp || item.created_at || item.createdAt || new Date().toISOString(),
      isSuspicious: item.is_suspicious || item.isSuspicious || false
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(history);
}
