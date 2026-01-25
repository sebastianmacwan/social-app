// "use client";

// import { useLanguage } from "@/context/LanguageContext";

// export default function LanguageSwitcher() {
//   const { lang, setLang } = useLanguage();

//   return (
//     <select
//       value={lang}
//       onChange={(e) => setLang(e.target.value as "en" | "hi")}
//       style={{
//         border: "1px solid #e5e7eb",
//         padding: "4px 6px",
//         borderRadius: 6,
//         fontSize: "0.8rem",
//         background: "white",
//       }}
//     >
//       <option value="en">English</option>
//       <option value="hi">हिंदी</option>
//       <option value="fr">Français</option>
//       <option value="es">Español</option>
//       <option value="pt">Português</option>
//       <option value="zh">Chinese</option>
//     </select>
//   );
// }

//21 jan working version with otp
"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [pendingLang, setPendingLang] = useState<Lang | null>(null);
  const [otp, setOtp] = useState("");


  type Lang = "en" | "hi" | "fr" | "es" | "pt" | "zh";

  // const handleChange = async (newLang: Lang) => {
  //   if (newLang === lang) return;

  //   // French → Email OTP
  //   if (newLang === "fr") {
  //     await fetch("/api/otp/send", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ type: "email", lang: newLang }),
  //     });
  //     alert("OTP sent to your email");
  //     return;
  //   }

  //   // Other non-English languages → Mobile OTP
  //   if (newLang !== "en") {
  //     await fetch("/api/otp/send", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ type: "mobile", lang: newLang }),
  //     });
  //     alert("OTP sent to your mobile number");
  //     return;
  //   }

  //   // English → No verification
  //   setLang(newLang);
  // };
  const handleChange = async (newLang: Lang) => {
    if (newLang === lang) return;

    // English → no verification
    if (newLang === "en") {
      setLang(newLang);
      return;
    }

    // Store requested language
    setPendingLang(newLang);

    // French → Email OTP
    if (newLang === "fr") {
      await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", lang: newLang }),
      });
      alert("OTP sent to your email");
      return;
    }

    // Other languages → Mobile OTP
    await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "mobile", lang: newLang }),
    });
    alert("OTP sent to your mobile number");
  };
  const verifyOtp = async () => {
    if (!pendingLang) return;

    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp }),
    });

    const data = await res.json();

    if (data.success) {
      setLang(pendingLang);
      setPendingLang(null);
      setOtp("");
      alert("Language changed successfully");
    } else {
      alert(data.error || "Invalid OTP");
    }
  };

  return (
    <>
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
    >
      <option value="en">English</option>
      <option value="hi">हिंदी</option>
      <option value="fr">Français</option>
      <option value="es">Español</option>
      <option value="pt">Português</option>
      <option value="zh">Chinese</option>
    </select>
    {/* OTP Verification UI */ }
  {
    pendingLang && (
      <div style={{ marginTop: 6 }}>
        <input
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          style={{
            border: "1px solid #e5e7eb",
            padding: "4px 6px",
            borderRadius: 6,
            fontSize: "0.75rem",
            marginRight: 4,
          }}
        />
        <button onClick={verifyOtp} style={{ fontSize: "0.75rem" }}>
          Verify
        </button>
      </div>
    )
  }
    </>
  );
}
