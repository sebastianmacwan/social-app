import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json([], { status: 401 });
  }

  // Mock login history since we don't have a database table yet
  const mockHistory = [
    {
      id: "1",
      ip: "192.168.1.1",
      browser: "Chrome",
      os: "Windows",
      device: "Desktop",
      isSuspicious: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: "2",
      ip: "192.168.1.1",
      browser: "Chrome",
      os: "Windows",
      device: "Desktop",
      isSuspicious: false,
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
  ];

  return NextResponse.json(mockHistory);
}
