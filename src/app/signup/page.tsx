"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState(""); // ✅ added
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // ✅ added
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,     // ✅ required by Prisma
        email,
        phone,    // ✅ added
        password,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      alert("Signup successful. Please login.");
      router.push("/login");
    } else {
      if (data.message && data.message.includes("rate limit")) {
        alert("Too many signup attempts. Please wait a few minutes before trying again.");
      } else {
        alert(data.message || "Signup failed");
      }
    }
  };

  return (
    <div style={{ maxWidth: 350, margin: "50px auto" }}>
      <h2>Signup</h2>

      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <br /><br />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <br /><br />

        <input
          type="tel"
          placeholder="Phone Number (e.g. +91...)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <br /><br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <br /><br />

        <button disabled={loading}>
          {loading ? "Creating account..." : "Signup"}
        </button>
      </form>
    </div>
  );
}
