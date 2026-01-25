// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";


// type LoginItem = {
//   id: number;
//   ip: string;
//   browser: string;
//   os: string;
//   device: string;
//   isSuspicious: boolean;
//   createdAt: string;
// };

// export default function LoginHistoryPage() {
//   const [data, setData] = useState<LoginItem[]>([]);

//   useEffect(() => {
//     fetch("/api/auth/login-history")
//       .then(res => res.json())
//       .then(setData);
//   }, []);

//   return (
//     <main className="max-w-3xl mx-auto px-4 py-6">
//         <Link
//   href="/profile"
//   className="text-sm text-blue-600 hover:underline mb-4 inline-block"
// >
//   ← Back to Profile
// </Link>
//       <h1 className="text-2xl font-bold mb-6">Login History</h1>

//       <div className="space-y-4">
//         {data.map(item => (
//           <div
//             key={item.id}
//             className="border rounded-lg p-4 bg-white"
//           >
//             <p><strong>IP:</strong> {item.ip}</p>
//             <p><strong>Browser:</strong> {item.browser}</p>
//             <p><strong>OS:</strong> {item.os}</p>
//             <p><strong>Device:</strong> {item.device}</p>
//             <p className="text-sm text-gray-500">
//               {new Date(item.createdAt).toLocaleString()}
//             </p>

//             {item.isSuspicious && (
//               <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-red-100 text-red-600">
//                 Suspicious Login
//               </span>
//             )}
//           </div>
//         ))}
//       </div>
//     </main>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LoginItem = {
  id: number;
  ip: string;
  browser: string;
  os: string;
  device: string;
  isSuspicious: boolean;
  createdAt: string;
};

export default function LoginHistoryPage() {
  const [data, setData] = useState<LoginItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/login-history")
      .then(res => {
        if (!res.ok) {
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Please login to view login history"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <Link
        href="/profile"
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Profile
      </Link>

      <h1 className="text-2xl font-bold mb-6">Login History</h1>

      {loading && <p className="text-gray-500">Loading...</p>}

      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && data.length === 0 && (
        <p className="text-gray-500">No login history found.</p>
      )}

      <div className="space-y-4">
        {data.map(item => (
          <div
            key={item.id}
            className="border rounded-lg p-4 bg-white"
          >
            <p><strong>IP:</strong> {item.ip}</p>
            <p><strong>Browser:</strong> {item.browser}</p>
            <p><strong>OS:</strong> {item.os}</p>
            <p><strong>Device:</strong> {item.device}</p>

            <p className="text-sm text-gray-500">
              {new Date(item.createdAt).toLocaleString()}
            </p>

            {item.isSuspicious && (
              <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-red-100 text-red-700 font-medium">
                Suspicious Login
              </span>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
