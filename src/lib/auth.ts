import { cookies } from "next/headers";

export async function getCurrentUserId(): Promise<string | null> {
  const userId = cookies().get("userId")?.value;
  if (!userId) return null;

  return userId;
}
