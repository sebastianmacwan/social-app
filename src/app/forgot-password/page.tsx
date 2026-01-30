"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

const TEXT = {
  en: {
    title: "Forgot Password",
    placeholder: "Email or Phone",
    submit: "Reset Password",
    success: "Password reset successful. Check your email/phone.",
    backToLogin: "Back to Login",
    dailyLimit: "Daily limit reached. Please try again tomorrow.",
    userNotFound: "User not found.",
    error: "An error occurred.",
  },
  hi: {
    title: "पासवर्ड भूल गए?",
    placeholder: "ईमेल या फोन",
    submit: "पासवर्ड रीसेट करें",
    success: "पासवर्ड सफलतापूर्वक रीसेट हो गया। अपना ईमेल/फोन चेक करें।",
    backToLogin: "लॉगिन पर वापस जाएं",
    dailyLimit: "दैनिक सीमा समाप्त। कृपया कल पुन: प्रयास करें।",
    userNotFound: "उपयोगकर्ता नहीं मिला।",
    error: "एक त्रुटि हुई।",
  },
};

export default function ForgotPasswordPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang] || TEXT.en;
  const router = useRouter();

  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value.includes("@") ? value : undefined,
          phone: !value.includes("@") ? value : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: t.success });
      } else {
        let errorText = t.error;
        if (res.status === 429) errorText = t.dailyLimit;
        if (res.status === 404) errorText = t.userNotFound;
        setMessage({ type: "error", text: data.error || errorText });
      }
    } catch (err) {
      setMessage({ type: "error", text: t.error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-6">{t.title}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder={t.placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all"
          >
            {loading ? "..." : t.submit}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center text-sm ${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {message.text}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-gray-600 hover:text-black font-medium"
          >
            ← {t.backToLogin}
          </button>
        </div>
      </div>
    </main>
  );
}
