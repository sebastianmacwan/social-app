// app/profile/ProfileClient.tsx
"use client";

import { useLanguage } from "@/context/LanguageContext";

const TEXT = {
  en: {
    title: "Profile",
    name: "Name",
    email: "Email",
    points: "Points",
    subscriptionPlan: "Subscription Plan",
    validUntil: "Valid Until",
  },
  hi: {
    title: "प्रोफ़ाइल",
    name: "नाम",
    email: "ईमेल",
    points: "अंक",
    subscriptionPlan: "सदस्यता योजना",
    validUntil: "मान्य तिथि",
  },
  fr: {
    title: "Votre Profil",
    name: "Nom",
    email: "Email",
    points: "Points",
    subscriptionPlan: "Plan d'abonnement",
    validUntil: "Valide jusqu'au",
  },
  es: {
    title: "Tu perfil",
    name: "Nombre",
    email: "Correo Electrónico",
    points: "Puntos",
    subscriptionPlan: "Plan de Suscripción",
    validUntil: "Válido Hasta",
  },
  pt: {
    title: "Seu Perfil",
    name: "Nome",
    email: "Email",
    points: "Pontos",
    subscriptionPlan: "Plano de Assinatura",
    validUntil: "Válido Até",
  },
  zh: {
    title: "您的个人资料",
    name: "姓名",
    email: "电子邮件",
    points: "积分",
    subscriptionPlan: "订阅计划",
    validUntil: "有效期至",
  },
};

export default function ProfileClient({ user }: any) {
  const { lang } = useLanguage();
  const t = TEXT[lang];

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">{t.title}</h1>

      <div className="space-y-2">
        <p>
          <strong>{t.name}:</strong> {user.name}
        </p>

        <p>
          <strong>{t.email}:</strong> {user.email}
        </p>

        <p>
          <strong>{t.points}:</strong>{" "}
          <span className="font-semibold text-green-600">
            {user.points}
          </span>
        </p>

        <p>
          <strong>{t.subscriptionPlan}:</strong>{" "}
          <span className="font-semibold">
            {user.subscriptionPlan}
          </span>
        </p>

        {user.subscriptionExpiresAt && (
          <p>
            <strong>{t.validUntil}:</strong>{" "}
            {new Date(user.subscriptionExpiresAt).toDateString()}
          </p>
        )}
      </div>
    </main>
  );
}
