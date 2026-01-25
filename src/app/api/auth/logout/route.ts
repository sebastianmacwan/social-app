// import { NextResponse } from "next/server";

// export async function POST() {
//   const response = NextResponse.json(
//     { message: "Logged out successfully" },
//     { status: 200 }
//   );

//   // Clear auth cookie (IMPORTANT)
//   response.cookies.set("token", "", {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     expires: new Date(0),
//     path: "/",
//   });

//   return response;
// }


import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  // Get the host from request headers
  const host = req.headers.get('host') || '';
  const domain = host.startsWith('localhost') ? undefined : host.split(':')[0];

  // ✅ Clear the SAME cookie used in login
  response.cookies.set("userId", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
    domain: domain, // Set domain for Vercel
  });

  return response;
}
