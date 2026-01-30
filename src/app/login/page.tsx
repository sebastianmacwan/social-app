"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<{name: string, requiresOtp: boolean} | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Detect browser on component mount
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = userAgent.includes("chrome") && !userAgent.includes("edg");
    const isEdge = userAgent.includes("edg");
    
    setBrowserInfo({
      name: isChrome ? "Chrome" : isEdge ? "Edge" : "Other",
      requiresOtp: isChrome
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password,
          userAgent: navigator.userAgent 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      if (data.requiresOtp) {
        setRequiresOtp(true);
        setSuccess("A 6-digit OTP has been sent to your email. Please check your inbox and enter the code below.");
        return;
      }

      // ✅ LOGIN SUCCESS
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => router.push("/"), 1000);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          otp,
          userAgent: navigator.userAgent 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid OTP");
        return;
      }

      // ✅ OTP VERIFIED, LOGIN SUCCESS
      setSuccess("OTP verified! Login successful. Redirecting...");
      setTimeout(() => router.push("/"), 1000);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleLogin}
      style={{
        maxWidth: 400,
        margin: "80px auto",
        padding: 20,
        border: "1px solid #ccc",
        borderRadius: 8,
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Login</h2>

      {browserInfo && (
        <div style={{ 
          padding: 10, 
          marginBottom: 20, 
          backgroundColor: browserInfo.requiresOtp ? "#fff3cd" : "#d4edda",
          border: browserInfo.requiresOtp ? "1px solid #ffeaa7" : "1px solid #c3e6cb",
          borderRadius: 4,
          fontSize: "14px"
        }}>
          <strong>Browser detected:</strong> {browserInfo.name}
          {browserInfo.requiresOtp && (
            <div style={{ marginTop: 5 }}>
              ✓ OTP verification required for Chrome browsers
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ 
          color: "#721c24", 
          backgroundColor: "#f8d7da", 
          border: "1px solid #f5c6cb",
          padding: 10, 
          borderRadius: 4, 
          marginBottom: 20,
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          color: "#155724", 
          backgroundColor: "#d4edda", 
          border: "1px solid #c3e6cb",
          padding: 10, 
          borderRadius: 4, 
          marginBottom: 20,
          fontSize: "14px"
        }}>
          {success}
        </div>
      )}

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          border: "1px solid #ddd",
          borderRadius: 4,
          marginBottom: 15,
          boxSizing: "border-box"
        }}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          border: "1px solid #ddd",
          borderRadius: 4,
          marginBottom: 20,
          boxSizing: "border-box"
        }}
      />

      <button 
        disabled={loading}
        style={{
          width: "100%",
          padding: 12,
          backgroundColor: loading ? "#6c757d" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "16px"
        }}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      {requiresOtp && (
        <div style={{ 
          marginTop: 20, 
          padding: 20, 
          border: "2px solid #007bff", 
          borderRadius: 8, 
          backgroundColor: "#f8f9fa" 
        }}>
          <h3 style={{ 
            margin: 0, 
            marginBottom: 15, 
            color: "#007bff", 
            textAlign: "center",
            fontSize: "18px"
          }}>
            🔐 OTP Verification Required
          </h3>
          <p style={{ 
            margin: 0, 
            marginBottom: 15, 
            fontSize: "14px",
            textAlign: "center",
            color: "#666"
          }}>
            For security, a 6-digit OTP has been sent to your email.
            <br />Please enter it below to complete your login.
          </p>
          <input
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              setOtp(value.slice(0, 6));
            }}
            style={{
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: 6,
              width: "100%",
              marginBottom: 15,
              fontSize: "18px",
              textAlign: "center",
              letterSpacing: "3px",
              fontWeight: "bold",
              backgroundColor: "#fff"
            }}
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <button 
            onClick={verifyOtp} 
            disabled={loading || otp.length !== 6}
            style={{
              padding: "12px 24px",
              backgroundColor: otp.length === 6 ? "#28a745" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: otp.length === 6 ? "pointer" : "not-allowed",
              width: "100%",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            {loading ? "⏳ Verifying..." : "✅ Verify OTP"}
          </button>
          
          <p style={{ 
            margin: "15px 0 0 0", 
            fontSize: "12px", 
            color: "#666",
            textAlign: "center"
          }}>
            OTP expires in 5 minutes
          </p>
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
