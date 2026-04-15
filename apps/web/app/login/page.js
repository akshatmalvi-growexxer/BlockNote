"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { apiRequest } from "../../lib/api";
import { setAccessToken } from "../../lib/auth";
import Toast from "../../components/Toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setToast("");
    setLoading(true);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAccessToken(data.accessToken);
      const destination = searchParams.get("from") || "/dashboard";
      router.push(destination);
    } catch (err) {
      setToast(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-card">
      <h1>Welcome back</h1>
      <p>Log in to continue building your documents.</p>
      <Toast message={toast} onClose={() => setToast("")} />
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Log in"}
          </button>
          <a href="/register">Need an account? Register</a>
        </div>
      </form>
    </section>
  );
}

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
