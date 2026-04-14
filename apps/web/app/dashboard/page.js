"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "../../lib/api";
import { clearAccessToken } from "../../lib/auth";
import { useAuthGuard } from "../../lib/useAuthGuard";
import Toast from "../../components/Toast";

function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return date.toLocaleString();
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuthGuard();
  const [documents, setDocuments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [toast, setToast] = useState("");

  async function loadDocuments() {
    setLoadingDocs(true);
    try {
      const data = await apiRequest("/documents");
      setDocuments(data.documents || []);
    } catch (err) {
      setToast(err.message || "Failed to load documents.");
    } finally {
      setLoadingDocs(false);
    }
  }

  useEffect(() => {
    if (!loading) {
      loadDocuments();
    }
  }, [loading]);

  async function handleLogout() {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      clearAccessToken();
      router.push("/login");
    }
  }

  async function handleCreate() {
    setBusy(true);
    setToast("");
    try {
      const data = await apiRequest("/documents", { method: "POST" });
      setDocuments((prev) => [data.document, ...prev]);
    } catch (err) {
      setToast(err.message || "Failed to create document.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(id, title) {
    try {
      const data = await apiRequest(`/documents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === id ? data.document : doc)),
      );
    } catch (err) {
      setToast(err.message || "Failed to rename document.");
    }
  }

  async function handleDelete(id) {
    setBusy(true);
    setToast("");
    try {
      await apiRequest(`/documents/${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      setToast(err.message || "Failed to delete document.");
    } finally {
      setBusy(false);
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
        <Toast message={toast} onClose={() => setToast("")} />
        <div className="dashboard-header">
          <div>
            <h1>Your documents</h1>
            <p>Signed in as {user?.email || "unknown user"}.</p>
          </div>
          <div className="dashboard-actions">
            <button type="button" onClick={handleCreate} disabled={busy}>
              {busy ? "Working..." : "New document"}
            </button>
            <button type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>

        {loadingDocs ? (
          <div className="loading-state">
            <span className="loading-dot" />
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <p className="empty-state">No documents yet. Create your first one.</p>
        ) : (
          <ul className="document-list">
            {documents.map((doc) => (
              <li key={doc.id} className="document-item">
                <div className="document-main">
                  <input
                    className="document-title"
                    defaultValue={doc.title}
                    onBlur={(event) =>
                      handleRename(doc.id, event.target.value)
                    }
                  />
                  <span className="document-meta">
                    Updated {formatTimestamp(doc.updatedAt)}
                  </span>
                </div>
                <button
                  type="button"
                  className="document-open"
                  onClick={() => router.push(`/documents/${doc.id}`)}
                >
                  Open
                </button>
                <button
                  type="button"
                  className="document-delete"
                  onClick={() => handleDelete(doc.id)}
                  disabled={busy}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
