"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { AuthContext } from "@/context/AuthContext";

const cssStyles = `
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f9fafb; color: #1f2937; -webkit-font-smoothing: antialiased; }
  
  .header { background: white; border-bottom: 1px solid #e5e7eb; padding: 0.75rem 1rem; position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
  .nav-container { max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
  
  .logo { display: flex; align-items: center; gap: 8px; text-decoration: none; font-weight: 800; font-size: 1.25rem; color: #111827; flex-shrink: 0; }
  .logo-icon { background: #2563eb; color: white; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 6px; font-size: 1rem; }
  .logo span { color: #2563eb; }

  .nav-links { display: flex; align-items: center; gap: 18px; list-style: none; margin: 0; padding: 0; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; }
  .nav-links::-webkit-scrollbar { display: none; }
  
  .nav-links a { text-decoration: none; color: #6b7280; font-weight: 600; font-size: 0.85rem; transition: all 0.2s; }
  .nav-links a:hover { color: #2563eb; }
  
  .main-content { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1rem; }

  @media (max-width: 768px) {
    .nav-container { flex-direction: column; align-items: flex-start; }
    .nav-links { width: 100%; padding-top: 0.5rem; border-top: 1px solid #f3f4f6; }
  }
`;

export default function RootLayout({ children }: any) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(setUser)
      .catch(() => {});
  }, []);

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      </head>
      <body>
        <LanguageProvider>
          <LayoutContent user={user} setUser={setUser}>
            {children}
          </LayoutContent>
        </LanguageProvider>
      </body>
    </html>
  );
}

/* 👇 SAME FILE — LOGIC WRAPPER ONLY */
function LayoutContent({
  children,
  user,
  setUser,
}: {
  children: React.ReactNode;
  user: any;
  setUser: any;
}) {
  const { t } = useLanguage();
  const [isRestricted, setIsRestricted] = useState(false);

  useEffect(() => {
    const checkRestriction = () => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (!isMobile) return false;

      const now = new Date();
      const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
      const istMinutes = utcMinutes + 330; // UTC+5:30
      const istHour = (Math.floor(istMinutes / 60)) % 24;

      // Restrict if NOT between 10 AM and 1 PM (10:00 - 13:00)
      return istHour < 10 || istHour >= 13;
    };

    setIsRestricted(checkRestriction());
  }, []);

  if (isRestricted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6 text-center">
        <div>
          <h1 className="text-3xl font-bold mb-4">Access Restricted</h1>
          <p className="text-lg text-gray-400">
            Mobile access is only allowed between <br />
            <span className="text-white font-bold text-xl">10:00 AM and 1:00 PM IST</span>.
          </p>
          <p className="mt-6 text-sm text-gray-500">
            Please use a desktop browser or wait for the permitted window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="header">
        <nav className="nav-container">
          <Link href="/" className="logo">
            <div className="logo-icon">S</div>
            Social<span>App</span>
          </Link>

          <div className="nav-links">
            <Link href="/">{t.nav.feed}</Link>
            <Link href="/friends">{t.nav.friends}</Link>
            <Link href="/rewards">{t.nav.rewards}</Link>
            <Link href="/profile">{t.nav.profile}</Link>
            <Link href="/subscription">{t.nav.subscriptions}</Link>
            <Link href="/friends/pending" style={{ opacity: 0.5 }}>
              {t.nav.pending}
            </Link>
            <Link href="/friends/sent" style={{ opacity: 0.5 }}>
              {t.nav.sent}
            </Link>
          </div>

          <LanguageSwitcher />
          <Link href="/profile/login-history">Login History</Link>
        </nav>
      </header>

      <main className="main-content">
        <AuthContext.Provider value={{ user, setUser }}>
          {children}
        </AuthContext.Provider>
      </main>
    </>
  );
}
