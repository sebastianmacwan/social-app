"use client";

import { useEffect, useState } from "react";

export default function PendingFriendsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/friend/pending")
      .then(res => res.json())
      .then(data => setRequests(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const accept = async (requestId: number) => {
    setProcessingId(requestId);

    const res = await fetch("/api/friend/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });

    if (res.ok) {
      setRequests(prev => prev.filter(r => r.id !== requestId));
    }

    setProcessingId(null);
  };

  const reject = async (requestId: number) => {
    setProcessingId(requestId);

    const res = await fetch("/api/friend/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });

    if (res.ok) {
      setRequests(prev => prev.filter(r => r.id !== requestId));
    }

    setProcessingId(null);
  };

  if (loading) {
    return <p className="text-center py-10">Loading pending requests...</p>;
  }

  return (
    <main className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Pending Friend Requests</h1>

      {requests.length === 0 ? (
        <p className="text-gray-500">No pending requests.</p>
      ) : (
        requests.map(req => (
          <div
            key={req.id}
            className="border p-4 rounded mb-3 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{req.user.name}</p>
              <p className="text-sm text-gray-500">{req.user.email}</p>
            </div>

            <div className="space-x-3">
              <button
                onClick={() => accept(req.id)}
                disabled={processingId === req.id}
                className="text-green-600 font-semibold disabled:opacity-50"
              >
                Accept
              </button>

              <button
                onClick={() => reject(req.id)}
                disabled={processingId === req.id}
                className="text-red-600 font-semibold disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </main>
  );
}



