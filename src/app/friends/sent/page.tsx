// "use client";

// import { useEffect, useState } from "react";

// export default function SentRequestsPage() {
//   const [requests, setRequests] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetch("/api/friend/sent")
//       .then(res => res.json())
//       .then(data => setRequests(Array.isArray(data) ? data : []))
//       .finally(() => setLoading(false));
//   }, []);

//   if (loading) {
//     return <p className="p-6">Loading sent requests...</p>;
//   }

//   return (
//     <main className="max-w-xl mx-auto py-10 px-4">
//       <h1 className="text-2xl font-bold mb-6">Sent Friend Requests</h1>

//       {requests.length === 0 ? (
//         <p className="text-gray-500">No sent requests.</p>
//       ) : (
//         <ul className="space-y-4">
//           {requests.map(req => (
//             <li
//               key={req.id}
//               className="border p-4 rounded flex justify-between"
//             >
//               <div>
//                 <p className="font-semibold">{req.friend.name}</p>
//                 <p className="text-sm text-gray-500">{req.friend.email}</p>
//               </div>

//               <span className="text-yellow-600 text-sm">
//                 Pending
//               </span>
//             </li>
//           ))}
//         </ul>
//       )}
//     </main>
//   );
// }

"use client";

import { useEffect, useState } from "react";

export default function SentRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/friend/sent")
      .then(res => res.json())
      .then(data => setRequests(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="p-6">Loading sent requests...</p>;
  }

  return (
    <main className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Sent Friend Requests</h1>

      {requests.length === 0 ? (
        <p className="text-gray-500">No sent requests.</p>
      ) : (
        <ul className="space-y-4">
          {requests.map(req => (
            <li
              key={req.id}
              className="border p-4 rounded flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{req.user.name}</p>
                <p className="text-sm text-gray-500">{req.user.email}</p>
              </div>

              <span className="text-yellow-600 text-sm font-medium">
                Pending
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
