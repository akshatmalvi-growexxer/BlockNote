"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const BLOCK_TYPES = {
  paragraph: "paragraph",
  heading_1: "heading_1",
  heading_2: "heading_2",
  todo: "todo",
  code: "code",
  divider: "divider",
  image: "image",
};

function renderBlock(block) {
  if (block.type === BLOCK_TYPES.divider) {
    return <hr className="share-divider" />;
  }
  if (block.type === BLOCK_TYPES.image) {
    return block.content?.url ? (
      <img src={block.content.url} alt={block.content?.alt || ""} />
    ) : (
      <div className="image-placeholder">Image URL not set.</div>
    );
  }
  if (block.type === BLOCK_TYPES.todo) {
    return (
      <label className="share-todo">
        <input type="checkbox" checked={Boolean(block.content?.checked)} readOnly />
        <span>{block.content?.text || ""}</span>
      </label>
    );
  }
  if (block.type === BLOCK_TYPES.code) {
    return <pre className="block-text block-code">{block.content?.text || ""}</pre>;
  }
  if (block.type === BLOCK_TYPES.heading_1) {
    return <h1 className="block-text block-heading_1">{block.content?.text || ""}</h1>;
  }
  if (block.type === BLOCK_TYPES.heading_2) {
    return <h2 className="block-text block-heading_2">{block.content?.text || ""}</h2>;
  }
  return <p className="block-text">{block.content?.text || ""}</p>;
}

export default function SharePage() {
  const { token } = useParams();
  const router = useRouter();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadShared() {
      try {
        const response = await fetch(`${API_URL}/share/${token}`, {
          credentials: "omit",
        });
        if (!response.ok) {
          throw new Error("Shared document not available.");
        }
        const data = await response.json();
        if (!cancelled) {
          setDocument(data.document);
        }
      } catch (error) {
        if (!cancelled) {
          router.push("/login");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadShared();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (loading) {
    return (
      <main className="editor-shell">
        <section className="editor-card">
          <h1>Loading shared document...</h1>
        </section>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="editor-shell">
        <section className="editor-card">
          <h1>Shared document not found.</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="editor-shell">
      <section className="editor-card">
        <header className="editor-header">
          <div>
            <p className="eyebrow">Shared</p>
            <h1>{document.title}</h1>
            <p className="save-state">Read-only</p>
          </div>
        </header>
        <div className="editor-blocks">
          {document.blocks?.length ? (
            document.blocks.map((block) => (
              <div key={block.id} className="block share-block">
                {renderBlock(block)}
              </div>
            ))
          ) : (
            <p className="auth-note">No blocks to display.</p>
          )}
        </div>
      </section>
    </main>
  );
}
