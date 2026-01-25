// import prisma from "@/lib/prisma";
// import React from "react";
// import { getCurrentUserId } from "@/lib/auth";
// export default async function ProfilePage() {
//   // TEMP: replace later with session user
//   const userId = await getCurrentUserId();
//   const user = await prisma.user.findUnique({
//   where: { id: userId },
//   select: {
//     id: true,
//     name: true,
//     email: true,
//     points: true,
//     subscriptionPlan: true,
//     subscriptionExpiresAt: true,
//   },
// });


//   if (!user) {
//     return <p>User not found</p>;
//   }

//   return (
//     // <main className="max-w-xl mx-auto py-10 px-4">
//     <main className="min-h-screen max-w-2xl mx-auto px-4 py-6">

//       <h1 className="text-2xl font-bold mb-4">Profile</h1>

//       <div className="space-y-2">
//         <p>
//           <strong>Name:</strong> {user.name}
//         </p>
//         <p>
//           <strong>Email:</strong> {user.email}
//         </p>
//         <p>
//   <strong>Points:</strong>{" "}
//   <span className="font-semibold text-green-600">
//     {user.points}
//   </span>
// </p>

//         <p>
//           <strong>Subscription Plan:</strong>{" "}
//           <span className="font-semibold">
//             {user.subscriptionPlan}
//           </span>
//         </p>

//         {user.subscriptionExpiresAt && (
//           <p>
//             <strong>Valid Until:</strong>{" "}
//             {new Date(user.subscriptionExpiresAt).toDateString()}
//           </p>
//         )}
//       </div>
//     </main>
//   );
// }

// app/profile/page.tsx (Server Component)

import supabase from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return <div>Please login</div>;
  }

  const { data: user, error } = await supabase
    .from('User')
    .select('id, name, email')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return <p>User not found</p>;
  }

  // Add default values for fields that don't exist in the simplified schema
  const userWithDefaults = {
    ...user,
    points: 0,
    subscriptionPlan: 'FREE',
    subscriptionExpiresAt: null,
  };

  return <ProfileClient user={userWithDefaults} />;
}
