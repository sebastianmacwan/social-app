"use client";

import { useState } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { getUserPoints } from "@/lib/rewards";

export default function TransferPointsPage() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!recipientEmail || !amount) {
      setMessage("Please fill in all fields");
      return;
    }

    const transferAmount = parseInt(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setMessage("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // First, find the recipient user
      const findUserRes = await fetch("/api/users/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recipientEmail }),
      });

      const findUserData = await findUserRes.json();

      if (!findUserData.success) {
        setMessage(findUserData.error || "User not found");
        return;
      }

      // Transfer points
      const transferRes = await fetch("/api/reward/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: findUserData.user.id,
          amount: transferAmount,
        }),
      });

      const transferData = await transferRes.json();

      if (transferData.error) {
        setMessage(transferData.error);
      } else {
        setMessage("Points transferred successfully!");
        setRecipientEmail("");
        setAmount("");
      }
    } catch (error) {
      setMessage("Transfer failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Transfer Points</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Recipient Email
          </label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter recipient's email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Amount to Transfer
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter amount"
            min="1"
          />
        </div>

        <button
          onClick={handleTransfer}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Transferring..." : "Transfer Points"}
        </button>

        {message && (
          <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}

        <div className="text-sm text-gray-600 mt-4">
          <p>• Minimum transfer amount: 1 point</p>
          <p>• You need at least 10 points to transfer</p>
          <p>• Points cannot be transferred to yourself</p>
        </div>
      </div>
    </main>
  );
}