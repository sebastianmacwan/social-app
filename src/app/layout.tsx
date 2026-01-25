"use client";

import { createContext, useEffect, useState } from "react";
import Link from "next/link";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export const AuthContext = createContext<any>(null);

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
