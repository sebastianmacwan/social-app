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

export async function POST() {
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  // ✅ Clear the SAME cookie used in login
  response.cookies.set("userId", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });

  return response;
}
