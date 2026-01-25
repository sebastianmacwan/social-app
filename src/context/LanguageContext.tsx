//21/jan  worked

// "use client";

// import { createContext, useContext, useEffect, useState } from "react";
// import { dictionaries } from "@/lib/i18n/dictionaries";

// type Lang = "en" | "hi";

// type LanguageContextType = {
//   lang: Lang;
//   setLang: (lang: Lang) => void;
//   t: typeof dictionaries.en;
// };

// const LanguageContext = createContext<LanguageContextType | null>(null);

// export function LanguageProvider({ children }: { children: React.ReactNode }) {
//   const [lang, setLangState] = useState<Lang>("en");

//   // ✅ Load language on first render
//   useEffect(() => {
//     const savedLang = localStorage.getItem("lang") as Lang | null;
//     if (savedLang) {
//       setLangState(savedLang);
//     }
//   }, []);

//   // ✅ Save language whenever it changes
//   const setLang = (newLang: Lang) => {
//     localStorage.setItem("lang", newLang);
//     setLangState(newLang);
//   };

//   return (
//     <LanguageContext.Provider
//       value={{
//         lang,
//         setLang,
//         t: dictionaries[lang],
//       }}
//     >
//       {children}
//     </LanguageContext.Provider>
//   );
// }

// export function useLanguage() {
//   const ctx = useContext(LanguageContext);
//   if (!ctx) {
//     throw new Error("useLanguage must be used inside LanguageProvider");
//   }
//   return ctx;
// }

//more language additions

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { dictionaries } from "@/lib/i18n/dictionaries";

type Lang = "en" | "hi" | "fr" | "es" | "pt" | "zh";

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: any;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as Lang | null;
    if (savedLang) {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: Lang) => {
    localStorage.setItem("lang", newLang);
    setLangState(newLang);
  };

  const value = {
    lang,
    setLang,
    t: dictionaries[lang] ?? dictionaries.en, // ✅ FIX
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return ctx;
}
