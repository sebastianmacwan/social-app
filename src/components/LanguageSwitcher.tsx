"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";

type Lang = "en" | "hi" | "fr" | "es" | "pt" | "zh";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [pendingLang, setPendingLang] = useState<Lang | null>(null);
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);

  const handleChange = async (newLang: Lang) => {
    if (newLang === lang) return;

    // French -> Email OTP
    // Others -> Mobile OTP
    // English -> Direct? (Assuming English doesn't need verification for UX, but prompt says "other language" uses Mobile. I'll assume English is "other" too if strictly following, but I'll skip for En as it's default).
    // Let's stick to prompt: "if they switch language to French... send an OTP to email... for other language we should do authenticate using mobile number".
    // This implies ALL other languages (Spanish, Hindi, Portugese, Chinese, English).

    setPendingLang(newLang);

    try {
      const res = await fetch("/api/user/language/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLanguage: newLang }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        setShowOtpInput(true);
      } else {
        alert(data.error || "Failed to request OTP");
        setPendingLang(null);
      }
    } catch (error) {
      console.error("Error requesting OTP:", error);
      alert("Something went wrong");
      setPendingLang(null);
    }
  };

  const verifyOtp = async () => {
    if (!pendingLang) return;

    try {
      const res = await fetch("/api/user/language/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, targetLanguage: pendingLang }),
      });

      const data = await res.json();

      if (data.success) {
        setLang(pendingLang);
        setPendingLang(null);
        setOtp("");
        setShowOtpInput(false);
        alert("Language changed successfully");
      } else {
        alert(data.error || "Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("Verification failed");
    }
  };

  return (
    <div>
      <select
        value={lang}
        onChange={(e) => handleChange(e.target.value as Lang)}
        style={{
          border: "1px solid #e5e7eb",
          padding: "4px 6px",
          borderRadius: 6,
          fontSize: "0.8rem",
          background: "white",
        }}
        disabled={showOtpInput}
      >
        <option value="en">English</option>
        <option value="hi">Hindi</option>
        <option value="fr">French</option>
        <option value="es">Spanish</option>
        <option value="pt">Portuguese</option>
        <option value="zh">Chinese</option>
      </select>

      {showOtpInput && (
        <div style={{ marginTop: 6, display: "flex", gap: "4px" }}>
          <input
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{
              border: "1px solid #e5e7eb",
              padding: "4px 6px",
              borderRadius: 6,
              fontSize: "0.75rem",
              width: "80px",
            }}
          />
          <button 
            onClick={verifyOtp} 
            style={{ 
              fontSize: "0.75rem",
              padding: "4px 8px",
              background: "#2563eb",
              color: "white",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer"
            }}
          >
            Verify
          </button>
          <button 
            onClick={() => { setShowOtpInput(false); setPendingLang(null); setOtp(""); }}
            style={{ 
              fontSize: "0.75rem",
              padding: "4px 8px",
              background: "#e5e7eb",
              color: "black",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
