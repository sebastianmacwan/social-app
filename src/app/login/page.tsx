"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.message || "Login failed");
      return;
    }

    if (data.requiresOtp) {
      setRequiresOtp(true);
      alert("A 6-digit OTP has been sent to your email. Please check your inbox and enter the code below.");
      return;
    }

    // ✅ LOGIN SUCCESS
    router.push("/");
  }

  async function verifyOtp() {
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, otp }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.message || "Invalid OTP");
      return;
    }

    // ✅ OTP VERIFIED, LOGIN SUCCESS
    router.push("/");
  }

  return (
    <form
      onSubmit={handleLogin}
      style={{
        maxWidth: 400,
        margin: "80px auto",
        padding: 20,
        border: "1px solid #ccc",
      }}
    >
      <h2>Login</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>

      {requiresOtp && (
        <div style={{ marginTop: 20, padding: 15, border: "1px solid #007bff", borderRadius: 5, backgroundColor: "#f8f9fa" }}>
          <h3 style={{ margin: 0, marginBottom: 10, color: "#007bff" }}>OTP Verification Required</h3>
          <p style={{ margin: 0, marginBottom: 10, fontSize: "14px" }}>Please enter the 6-digit OTP sent to your email.</p>
          <input
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: 3,
              width: "100%",
              marginBottom: 10,
              fontSize: "16px",
              textAlign: "center",
              letterSpacing: "2px"
            }}
            maxLength={6}
          />
          <button 
            onClick={verifyOtp} 
            disabled={loading || otp.length !== 6}
            style={{
              padding: "8px 16px",
              backgroundColor: otp.length === 6 ? "#007bff" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: 3,
              cursor: otp.length === 6 ? "pointer" : "not-allowed",
              width: "100%"
            }}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </div>
      )}

<p>
  Don’t have an account? <a href="/signup">Signup</a>
</p>

      <p style={{ marginTop: 10 }}>
        <a href="/forgot-password">Forgot password?</a>
      </p>
    </form>
  );
}
