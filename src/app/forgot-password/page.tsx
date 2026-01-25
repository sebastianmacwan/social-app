// "use client";

// import { useState } from "react";

// export default function ForgotPasswordPage() {
//     const [email, setEmail] = useState("");
//     const [phone, setPhone] = useState("");
//     const [message, setMessage] = useState("");

//     const handleSubmit = async () => {
//         setMessage("");
//         if (!email && !phone) {
//             setMessage("Please provide email or phone number");
//             return;
//         }


//         const res = await fetch("/api/forgot-password", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ email, phone }),
//         });

//         const data = await res.json();

//         if (!res.ok) {
//             setMessage(data.error);
//         } else {
//             setMessage(
//                 `Your new password is: ${data.newPassword} (change it later)`
//             );
//         }
//     };

//     return (
//         <div style={{ maxWidth: 400, margin: "50px auto" }}>
//             <h2>Forgot Password</h2>

//             <input
//                 placeholder="Email (optional)"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 style={{ width: "100%", marginBottom: 10 }}
//             />

//             <input
//                 placeholder="Phone (optional)"
//                 value={phone}
//                 onChange={(e) => setPhone(e.target.value)}
//                 style={{ width: "100%", marginBottom: 10 }}
//             />

//             <button onClick={handleSubmit}>Reset Password</button>

//             {message && (
//                 <p style={{ marginTop: 15 }}>{message}</p>

//             )}
//         </div>
//     );
// }


"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");

  const submit = async () => {
    setMessage("");

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: value.includes("@") ? value : undefined,
        phone: !value.includes("@") ? value : undefined,
      }),
    });

    const data = await res.json();
    setMessage(data.error || data.message);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Forgot Password</h2>

      <input
        placeholder="Email or Phone"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <br /><br />
      <button onClick={submit}>Reset Password</button>

      <p>{message}</p>
    </div>
  );
}
