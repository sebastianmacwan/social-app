import { getCurrentUserId } from "@/lib/auth";
import { getUserPoints } from "@/lib/rewards";

export default async function RewardsPage() {
  const userId = await getCurrentUserId();
  if (!userId) return <div>Please login</div>;

  const points = await getUserPoints(userId);

  // For now, show empty history since we don't have transaction tracking yet
  const history: any[] = [];

  return (
    <main className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Reward History</h1>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Your Points</h2>
        <p className="text-3xl font-bold text-blue-600">{points} points</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">How to Earn Points</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Answer a question: +5 points</li>
          <li>• Answer gets 5 upvotes: +5 additional points</li>
          <li>• Answer gets downvoted: -5 points</li>
          <li>• Answer removed: -5 points</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Transfer Points</h3>
        <p className="text-sm text-gray-600 mb-4">
          You can transfer points to other users (minimum 10 points required to transfer).
        </p>
        <a
          href="/transfer-points"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Transfer Points
        </a>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
        {history.length === 0 ? (
          <p className="text-gray-500">No transaction history available.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((h: any) => (
              <li key={h.id} className="border p-3 rounded">
                <p className="font-medium">{h.reason}</p>
                <p className="text-sm text-gray-500">
                  {h.amount > 0 ? "+" : ""}
                  {h.amount} points ·{" "}
                  {new Date(h.createdAt).toDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
