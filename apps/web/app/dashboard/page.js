"use client";

import { useRouter } from "next/navigation";

import { apiRequest } from "../../lib/api";
import { clearAccessToken } from "../../lib/auth";
import { useAuthGuard } from "../../lib/useAuthGuard";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuthGuard();

  async function handleLogout() {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      clearAccessToken();
      router.push("/login");
    }
  }

  if (loading) {
    return (
      <main className="dashboard-shell">
        <section className="dashboard-card">
          <h1>Loading your workspace...</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-card">
        <h1>Dashboard</h1>
        <p>Signed in as {user?.email || "unknown user"}.</p>
        <button type="button" onClick={handleLogout}>
          Log out
        </button>
      </section>
    </main>
  );
}
