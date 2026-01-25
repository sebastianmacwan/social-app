"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const TEXT = {
  en: {
    title: "Your Friends",
    desc: "Manage your connections and remove friends if needed.",
    empty: "You have no friends yet.",
    unfriend: "Unfriend",
    findFriends: "Find New Friends",
    pending: "Pending Requests",
    sent: "Sent Requests",
  },
  hi: {
    title: "आपके दोस्त",
    desc: "अपने संपर्कों को प्रबंधित करें और आवश्यकता होने पर दोस्तों को हटाएं।",
    empty: "आपके पास अभी कोई दोस्त नहीं है।",
    unfriend: "हटाएं",
    findFriends: "नए दोस्त खोजें",
    pending: "लंबित अनुरोध",
    sent: "भेजे गए अनुरोध",
  },
  fr: {
    title: "Vos amis",
    desc: "Gérez vos connexions et supprimez des amis si nécessaire.",
    empty: "Vous n'avez pas encore d'amis.",
    unfriend: "Supprimer",
    findFriends: "Trouver de nouveaux amis",
    pending: "Demandes en attente",
    sent: "Demandes envoyées",
  },
  es: {
    title: "Tus amigos",
    desc: "Administra tus conexiones y elimina amigos si es necesario.",
    empty: "Aún no tienes amigos.",
    unfriend: "Eliminar",
    findFriends: "Encontrar nuevos amigos",
    pending: "Solicitudes pendientes",
    sent: "Solicitudes enviadas",
  },
  pt: {
    title: "Seus amigos",
    desc: "Gerencie suas conexões e remova amigos se necessário.",
    empty: "Você ainda não tem amigos.",
    unfriend: "Remover",
    findFriends: "Encontrar novos amigos",
    pending: "Pedidos pendentes",
    sent: "Pedidos enviados",
  },
  zh: {
    title: "你的朋友",
    desc: "管理你的联系人，并在需要时删除好友。",
    empty: "你还没有朋友。",
    unfriend: "删除",
    findFriends: "寻找新朋友",
    pending: "待处理请求",
    sent: "已发送请求",
  },
};

export default function FriendsPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];

  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/friend/list")
      .then(res => res.json())
      .then(setFriends)
      .finally(() => setLoading(false));
  }, []);

  const unfriend = async (friendId: string) => {
    await fetch("/api/friend/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });

    setFriends(prev => prev.filter(f => f.id !== friendId));
  };

  return (
    <main className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">{t.title}</h1>
      <p className="text-gray-500 mb-4">{t.desc}</p>

      <div className="mb-6 flex gap-8 items-center">
        <a href="/find-friends" className="text-blue-600 underline">
          {t.findFriends}
        </a>
        <span className="text-gray-400">|</span>
        <a href="/friends/pending" className="text-blue-600 underline">
          {t.pending}
        </a>
        <span className="text-gray-400">|</span>
        <a href="/friends/sent" className="text-blue-600 underline">
          {t.sent}
        </a>
      </div>

      {friends.length === 0 ? (
        <p className="text-gray-500">{t.empty}</p>
      ) : (
        <ul className="space-y-4">
          {friends.map(f => (
            <li
              key={f.id}
              className="flex justify-between items-center border p-4 rounded"
            >
              <div>
                <p className="font-semibold">{f.name}</p>
                <p className="text-sm text-gray-500">{f.email}</p>
              </div>

              <button
                onClick={() => unfriend(f.id)}
                className="text-red-600"
              >
                {t.unfriend}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
