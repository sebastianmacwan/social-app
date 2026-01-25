// "use client";

// import { useEffect, useState } from "react";

// export default function RewardsPage() {
//   const [points, setPoints] = useState<number>(0);
//   const [receiverId, setReceiverId] = useState("");
//   const [amount, setAmount] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");

//   useEffect(() => {
//     fetch("/api/auth/me")
//       .then(res => res.json())
//       .then(user => {
//   if (!user) {
//     setPoints(0);
//     return;
//   }
//   setPoints(user.points ?? 0);
// });

//   }, []);

//   const handleTransfer = async () => {
//     setMessage("");

//     if (points < 10) {
//       setMessage("You need at least 10 points to transfer.");
//       return;
//     }

//     if (!receiverId || !amount) {
//       setMessage("All fields are required.");
//       return;
//     }

//     setLoading(true);

//     const res = await fetch("/api/reward/transfer", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         receiverId: Number(receiverId),
//         amount: Number(amount),
//       }),
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       setMessage(data.error || "Transfer failed");
//     } else {
//       setMessage("Points transferred successfully!");
//       setPoints(prev => prev - Number(amount));
//       setReceiverId("");
//       setAmount("");
//     }

//     setLoading(false);
//   };

//   return (
//     // <main className="max-w-xl mx-auto py-10 px-4">
//     <main className="min-h-screen max-w-2xl mx-auto px-4 py-6">

//       <h1 className="text-2xl font-bold mb-6">Rewards</h1>

//       {/* Points Card */}
//       <div className="border rounded-lg p-6 mb-6 bg-gray-50">
//         <p className="text-gray-600">Your Points</p>
//         <p className="text-3xl font-bold text-green-600">{points}</p>
//       </div>

//       {/* Transfer Card */}
//       <div className="border rounded-lg p-6 space-y-4">
//         <h2 className="font-semibold text-lg">Transfer Points</h2>

//         <input
//           type="number"
//           placeholder="Receiver User ID"
//           value={receiverId}
//           onChange={e => setReceiverId(e.target.value)}
//           className="w-full border px-3 py-2 rounded"
//         />

//         <input
//           type="number"
//           placeholder="Points to transfer"
//           value={amount}
//           onChange={e => setAmount(e.target.value)}
//           className="w-full border px-3 py-2 rounded"
//         />

//         <button
//           onClick={handleTransfer}
//           disabled={loading}
//           className="w-full bg-black text-white py-2 rounded hover:opacity-90 disabled:opacity-50"
//         >
//           {loading ? "Transferring..." : "Transfer"}
//         </button>

//         {message && (
//           <p className="text-sm text-center text-red-500">
//             {message}
//           </p>
//         )}
//       </div>
//     </main>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const TEXT = {
  en: {
    title: "Rewards",
    yourPoints: "Your Points",
    transferTitle: "Transfer Points",
    receiverPlaceholder: "Receiver User ID",
    amountPlaceholder: "Points to transfer",
    transfer: "Transfer",
    transferring: "Transferring...",
    minPointsError: "You need at least 10 points to transfer.",
    requiredError: "All fields are required.",
    success: "Points transferred successfully!",
    failed: "Transfer failed",
  },
  hi: {
    title: "इनाम",
    yourPoints: "आपके अंक",
    transferTitle: "अंक स्थानांतरित करें",
    receiverPlaceholder: "प्राप्तकर्ता उपयोगकर्ता आईडी",
    amountPlaceholder: "स्थानांतरित करने के अंक",
    transfer: "स्थानांतरित करें",
    transferring: "स्थानांतरित किया जा रहा है...",
    minPointsError: "स्थानांतरण के लिए कम से कम 10 अंक आवश्यक हैं।",
    requiredError: "सभी फ़ील्ड आवश्यक हैं।",
    success: "अंक सफलतापूर्वक स्थानांतरित किए गए!",
    failed: "स्थानांतरण विफल रहा",
  },
  fr: {
    title: "Récompenses",
    yourPoints: "Vos Points",
    transferTitle: "Transférer des points",
    receiverPlaceholder: "ID utilisateur du destinataire",
    amountPlaceholder: "Points à transférer",
    transfer: "Transférer",
    transferring: "Transfert en cours...",
    minPointsError: "Vous devez avoir au moins 10 points.",
    requiredError: "Tous les champs sont obligatoires.",
    success: "Points transférés avec succès !",
    failed: "Échec du transfert",
  },
  es: {
    title: "Recompensas",
    yourPoints: "Tus Puntos",
    transferTitle: "Transferir Puntos",
    receiverPlaceholder: "ID del usuario receptor",
    amountPlaceholder: "Puntos a transferir",
    transfer: "Transferir",
    transferring: "Transfiriendo...",
    minPointsError: "Necesitas al menos 10 puntos.",
    requiredError: "Todos los campos son obligatorios.",
    success: "¡Puntos transferidos con éxito!",
    failed: "La transferencia falló",
  },
  pt: {
    title: "Recompensas",
    yourPoints: "Seus Pontos",
    transferTitle: "Transferir Pontos",
    receiverPlaceholder: "ID do usuário receptor",
    amountPlaceholder: "Pontos para transferir",
    transfer: "Transferir",
    transferring: "Transferindo...",
    minPointsError: "Você precisa de pelo menos 10 pontos.",
    requiredError: "Todos os campos são obrigatórios.",
    success: "Pontos transferidos com sucesso!",
    failed: "Falha na transferência",
  },
  zh: {
    title: "奖励",
    yourPoints: "您的积分",
    transferTitle: "转移积分",
    receiverPlaceholder: "接收者用户ID",
    amountPlaceholder: "要转移的积分",
    transfer: "转移",
    transferring: "正在转移...",
    minPointsError: "至少需要10积分。",
    requiredError: "所有字段都是必填的。",
    success: "积分转移成功！",
    failed: "转移失败",
  },
};

export default function RewardsPage() {
  const { lang } = useLanguage();
  const t = TEXT[lang];

  const [points, setPoints] = useState<number>(0);
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(user => {
        if (!user) {
          setPoints(0);
          return;
        }
        setPoints(user.points ?? 0);
      });
  }, []);

  const handleTransfer = async () => {
    setMessage("");

    if (points < 10) {
      setMessage(t.minPointsError);
      return;
    }

    if (!receiverId || !amount) {
      setMessage(t.requiredError);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/reward/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: Number(receiverId),
        amount: Number(amount),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || t.failed);
    } else {
      setMessage(t.success);
      setPoints(prev => prev - Number(amount));
      setReceiverId("");
      setAmount("");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">{t.title}</h1>

      <div className="border rounded-lg p-6 mb-6 bg-gray-50">
        <p className="text-gray-600">{t.yourPoints}</p>
        <p className="text-3xl font-bold text-green-600">{points}</p>
      </div>

      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-lg">{t.transferTitle}</h2>

        <input
          type="number"
          placeholder={t.receiverPlaceholder}
          value={receiverId}
          onChange={e => setReceiverId(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />

        <input
          type="number"
          placeholder={t.amountPlaceholder}
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />

        <button
          onClick={handleTransfer}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded hover:opacity-90 disabled:opacity-50"
        >
          {loading ? t.transferring : t.transfer}
        </button>

        {message && (
          <p className="text-sm text-center text-red-500">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
