"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const TEXT = {
  en: {
    title: "Find Friends",
    desc: "Discover and connect with other users.",
    search: "Search users...",
    sendRequest: "Send Request",
    requestSent: "Request Sent",
    friends: "Friends",
    loading: "Loading...",
    requestReceived: "Request Received",
  },
  hi: {
    title: "दोस्त खोजें",
    desc: "अन्य उपयोगकर्ताओं को खोजें और जुड़ें।",
    search: "उपयोगकर्ताओं को खोजें...",
    sendRequest: "अनुरोध भेजें",
    requestSent: "अनुरोध भेजा गया",
    friends: "दोस्त",
    loading: "लोड हो रहा है...",
    requestReceived: "अनुरोध प्राप्त हुआ",
  },
  fr: {
    title: "Trouver des amis",
    desc: "Découvrez et connectez-vous avec d'autres utilisateurs.",
    search: "Rechercher des utilisateurs...",
    sendRequest: "Envoyer une demande",
    requestSent: "Demande envoyée",
    friends: "Amis",
    loading: "Chargement...",
    requestReceived: "Demande reçue",
  },
  es: {
    title: "Encontrar amigos",
    desc: "Descubre y conéctate con otros usuarios.",
    search: "Buscar usuarios...",
    sendRequest: "Enviar solicitud",
    requestSent: "Solicitud enviada",
    friends: "Amigos",
    loading: "Cargando...",
    requestReceived: "Solicitud recibida",
  },
  pt: {
    title: "Encontrar amigos",
    desc: "Descubra e conecte-se com outros usuários.",
    search: "Buscar usuários...",
    sendRequest: "Enviar pedido",
    requestSent: "Pedido enviado",
    friends: "Amigos",
    loading: "Carregando...",
    requestReceived: "Pedido recebido",
  },
  zh: {
    title: "寻找朋友",
    desc: "发现并与其他用户连接。",
    search: "搜索用户...",
    sendRequest: "发送请求",
    requestSent: "请求已发送",
    friends: "朋友",
    loading: "加载中...",
    requestReceived: "收到请求",
  },
};

interface User {
  id: string;
  name: string;
  email: string;
  status: string | null;
}

export default function FindFriendsPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (search) {
      setFilteredUsers(
        users.filter(user =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [search, users]);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function sendRequest(friendId: string) {
    try {
      const res = await fetch("/api/friend/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Friend added!");
        // Update status to ACCEPTED since we do direct adds now
        setUsers(users.map(user =>
          user.id === friendId ? { ...user, status: "ACCEPTED" } : user
        ));
      } else {
        alert(data.error || "Failed to add friend");
      }
    } catch (error) {
      console.error("Failed to add friend:", error);
    }
  }

  if (loading) {
    return <div style={{ padding: 20 }}>{t.loading}</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "20px auto", padding: 20 }}>
      <h1>{t.title}</h1>
      <p>{t.desc}</p>

      <input
        type="text"
        placeholder={t.search}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: 20,
          border: "1px solid #ccc",
          borderRadius: 4,
        }}
      />

      <div>
        {filteredUsers.map(user => (
          <div
            key={user.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px",
              border: "1px solid #eee",
              marginBottom: 10,
              borderRadius: 4,
            }}
          >
            <div>
              <strong>{user.name}</strong>
              <br />
              <small>{user.email}</small>
            </div>
            <div>
              {user.status === "ACCEPTED" && (
                <span style={{ color: "green" }}>{t.friends}</span>
              )}
              {!user.status && (
                <button onClick={() => sendRequest(user.id)}>
                  {t.sendRequest}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}