"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

const plans = [
  { id: "FREE", price: 0, limit: "friend_based" },
  { id: "BRONZE_100", price: 100, limit: "10 posts/day" },
  { id: "BRONZE_300", price: 300, limit: "20 posts/day" },
  { id: "GOLD", price: 1000, limit: "Unlimited" },
];

const TEXT = {
  en: {
    title: "Choose a Subscription",
    subscribe: "Subscribe",
    processing: "Processing...",
    restricted: "Payments are allowed only between 10 AM – 11 AM IST.",
    success: "Subscription activated successfully!",
    bronze: "Bronze",
    gold: "Gold",
    day: "day",
    questionsPerDay: "posts/day",
    friend_based: "Friend-based limits (0 friends: 0, 1: 1, 2-10: 2, >10: Unlimited)",
    "10 posts/day": "10 posts/day",
    "20 posts/day": "20 posts/day",
    month: "month",
    unlimited: "Unlimited",
    0: "Free",
    100: "100 INR",
    300: "300 INR",
    1000: "1000 INR",
    free: "Free",
  },
  hi: {
    title: "सदस्यता चुनें",
    subscribe: "सदस्यता लें",
    processing: "प्रक्रिया में...",
    restricted: "भुगतान केवल सुबह 10 बजे – 11 बजे (IST) के बीच मान्य है।",
    success: "सदस्यता सफलतापूर्वक सक्रिय हो गई!",
    bronze: "ब्रोंज",
    silver: "सिल्वर",
    gold: "गोल्ड",
    day: "दिन",
    questionsPerDay: "पोस्ट/दिन",
    friend_based: "मित्र-आधारित सीमाएं (0 मित्र: 0, 1: 1, 2-10: 2, >10: असीमित)",
    "10 posts/day": "10 पोस्ट/दिन",
    "20 posts/day": "20 पोस्ट/दिन",
    month: "महीना",
    unlimited: "असीमित",
    0: "नि:शुल्क",
    100: "100 रुपये",
    300: "300 रुपये",
    1000: "1000 रुपये",
    free: "नि:शुल्क",
  },
  fr: {
    title: "Choisir un abonnement",
    subscribe: "S’abonner",
    processing: "Traitement...",
    restricted: "Paiements autorisés uniquement entre 10h00 et 11h00 IST.",
    success: "Abonnement activé avec succès !",
    bronze: "Bronze",
    silver: "Argent",
    gold: "Or",
    day: "jour",
    questionsPerDay: "posts/jour",
    friend_based: "Limites basées sur les amis (0 ami: 0, 1: 1, 2-10: 2, >10: Illimité)",
    "10 posts/day": "10 posts/jour",
    "20 posts/day": "20 posts/jour",
    month: "mois",
    unlimited: "Illimité",
    0: "Gratuit",
    100: "100 INR",
    300: "300 INR",
    1000: "1000 INR",
    free: "Gratuit",
  },
  es: {
    title: "Elegir suscripción",
    subscribe: "Suscribirse",
    processing: "Procesando...",
    restricted: "Pagos permitidos solo entre 10 AM y 11 AM IST.",
    success: "¡Suscripción activada con éxito!",
    bronze: "Bronce",
    silver: "Plata",
    gold: "Oro",
    day: "día",
    questionsPerDay: "publicaciones/día",
    friend_based: "Límites basados en amigos (0 amigos: 0, 1: 1, 2-10: 2, >10: Ilimitado)",
    "10 posts/day": "10 publicaciones/día",
    "20 posts/day": "20 publicaciones/día",
    month: "mes",
    unlimited: "Ilimitado",
    0: "Gratis",
    100: "100 INR",
    300: "300 INR",
    1000: "1000 INR",
    free: "Gratis",
  },
  pt: {
    title: "Escolher assinatura",
    subscribe: "Assinar",
    processing: "Processando...",
    restricted: "Pagamentos permitidos apenas entre 10h e 11h IST.",
    success: "Assinatura ativada com sucesso!",
    bronze: "Bronze",
    silver: "Prata",
    gold: "Ouro",
    day: "dia",
    questionsPerDay: "postagens/dia",
    friend_based: "Limites baseados em amigos (0 amigos: 0, 1: 1, 2-10: 2, >10: Ilimitado)",
    "10 posts/day": "10 postagens/dia",
    "20 posts/day": "20 postagens/dia",
    month: "mês",
    unlimited: "Ilimitado",
    0: "Grátis",
    100: "100 INR",
    300: "300 INR",
    1000: "1000 INR",
    free: "Grátis",
  },
  zh: {
    title: "选择订阅",
    subscribe: "订阅",
    processing: "处理中...",
    restricted: "仅允许在印度标准时间 10:00 至 11:00 之间付款。",
    success: "订阅成功！",
    bronze: "青铜",
    silver: "白银",
    gold: "黄金",
    day: "天",
    questionsPerDay: "帖子/天",
    friend_based: "基于好友的限制（0个好友：0，1个：1，2-10个：2，>10个：无限）",
    "10 posts/day": "10 帖子/天",
    "20 posts/day": "20 帖子/天",
    month: "月",
    unlimited: "无限",
    0: "免费",
    100: "100 印度卢比",
    300: "300 印度卢比",
    1000: "1000 印度卢比",
    free: "免费",
  },
};

export default function SubscriptionPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];

  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("FREE");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(user => {
        if (user && user.subscriptionPlan) {
          setCurrentPlan(user.subscriptionPlan.toUpperCase());
        }
      });
  }, []);

  const subscribe = async (plan: string) => {
    setLoading(plan);
    setToast(null);

    const res = await fetch("/api/subscription/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();

    if (res.status === 403) {
      setToast({ type: "error", text: t.restricted });
    } else if (!res.ok) {
      setToast({ type: "error", text: data.error || "Failed to subscribe" });
    } else {
      setToast({ type: "success", text: t.success });
      setCurrentPlan(plan);
    }

    setLoading(null);

    // Auto-dismiss toast
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">{t.title}</h1>

      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <p className="text-lg font-semibold">Current Plan: {currentPlan}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map(plan => (
          <div
            key={plan.id}
            className="border rounded-xl p-6 shadow-sm bg-white"
          >
            <h2 className="text-xl font-semibold">
              {plan.id === "FREE" ? t.free :
               plan.id.startsWith("BRONZE") ? t.bronze :
               plan.id === "GOLD" ? t.gold : plan.id}
            </h2>

            <p className="text-gray-600 mt-1">
              {t[plan.price]} / {t.month}
            </p>
            <p className="mt-2 text-sm">
              {t[plan.limit]}
            </p>


            <button
              disabled={loading === plan.id}
              onClick={() => subscribe(plan.id)}
              className="mt-4 w-full py-2 rounded bg-black text-white disabled:opacity-50"
            >
              {loading === plan.id ? t.processing : t.subscribe}
            </button>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg text-white transition-all
            ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
        >
          {toast.text}
        </div>
      )}
    </main>
  );
}
