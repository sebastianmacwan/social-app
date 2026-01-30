"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

const TEXT = {
  en: {
    title: "Transfer Points",
    currentPoints: "Your current points",
    recipient: "Recipient Email",
    amount: "Amount to transfer",
    transfer: "Transfer Points",
    processing: "Processing...",
    success: "Points transferred successfully!",
    minPoints: "You need more than 10 points to transfer.",
    userNotFound: "Recipient user not found.",
    insufficient: "Insufficient points balance.",
    invalidAmount: "Please enter a valid amount.",
    error: "Transfer failed. Please try again.",
  },
  hi: {
    title: "पॉइंट्स ट्रांसफर करें",
    currentPoints: "आपके वर्तमान पॉइंट्स",
    recipient: "प्राप्तकर्ता का ईमेल",
    amount: "ट्रांसफर करने के लिए राशि",
    transfer: "पॉइंट्स ट्रांसफर करें",
    processing: "प्रक्रिया में...",
    success: "पॉइंट्स सफलतापूर्वक ट्रांसफर हो गए!",
    minPoints: "ट्रांसफर करने के लिए आपके पास 10 से अधिक पॉइंट्स होने चाहिए।",
    userNotFound: "प्राप्तकर्ता उपयोगकर्ता नहीं मिला।",
    insufficient: "अपर्याप्त पॉइंट्स बैलेंस।",
    invalidAmount: "कृपया वैध राशि दर्ज करें।",
    error: "ट्रांसफर विफल रहा। कृपया पुन: प्रयास करें।",
  },
};

export default function TransferPointsPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang] || TEXT.en;
  const router = useRouter();

  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [userPoints, setUserPoints] = useState<number>(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data && data.points !== undefined) {
          setUserPoints(data.points);
        }
      });
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userPoints <= 10) {
      setMessage({ type: "error", text: t.minPoints });
      return;
    }

    const transferAmount = parseInt(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setMessage({ type: "error", text: t.invalidAmount });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Find recipient
      const findRes = await fetch("/api/users/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recipientEmail }),
      });
      const findData = await findRes.json();

      if (!findRes.ok || !findData.user) {
        setMessage({ type: "error", text: t.userNotFound });
        setLoading(false);
        return;
      }

      // Perform transfer
      const res = await fetch("/api/rewards/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: findData.user.id,
          amount: transferAmount,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: t.success });
        setUserPoints(prev => prev - transferAmount);
        setRecipientEmail("");
        setAmount("");
      } else {
        setMessage({ type: "error", text: data.error || t.error });
      }
    } catch (err) {
      setMessage({ type: "error", text: t.error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <div className="text-right">
            <p className="text-sm text-gray-500">{t.currentPoints}</p>
            <p className="text-xl font-bold">{userPoints}</p>
          </div>
        </div>

        <form onSubmit={handleTransfer} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.recipient}
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.amount}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
              placeholder="0"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || userPoints <= 10}
            className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg"
          >
            {loading ? t.processing : t.transfer}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-xl text-center font-medium ${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </main>
  );
}