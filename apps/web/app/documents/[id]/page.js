"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { apiRequest } from "../../../lib/api";
import { useAuthGuard } from "../../../lib/useAuthGuard";

const BLOCK_TYPES = {
  paragraph: "Paragraph",
  heading_1: "Heading 1",
  heading_2: "Heading 2",
  todo: "To-do",
  code: "Code",
  divider: "Divider",
  image: "Image",
};

function getDisplayText(block) {
  if (!block?.content) return "";
  if (block.type === "todo") return block.content.text || "";
  if (block.type === "image") return block.content.url || "";
  return block.content.text || "";
}

export default function DocumentEditorPage() {
  const router = useRouter();
  const params = useParams();
  const { loading: authLoading } = useAuthGuard();
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const blockRefs = useRef(new Map());

  const documentId = params?.id;

  useEffect(() => {
    if (authLoading || !documentId) return;

    let cancelled = false;

    async function loadDocument() {
      setLoading(true);
      try {
        const data = await apiRequest(`/documents/${documentId}`);
        if (!cancelled) {
          setDocument(data.document);
          setBlocks(data.document.blocks || []);
          if (data.document.blocks?.length) {
            setActiveBlockId(data.document.blocks[0].id);
          }
        }
      } catch (error) {
        if (!cancelled) {
          router.push("/dashboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
    };
  }, [authLoading, documentId, router]);

  useEffect(() => {
    if (!activeBlockId) return;
    const node = blockRefs.current.get(activeBlockId);
    if (node && typeof node.focus === "function") {
      node.focus();
    }
  }, [activeBlockId]);

  const blockList = useMemo(() => blocks, [blocks]);

  function handleBlockSelect(blockId) {
    setActiveBlockId(blockId);
  }

  function handleTextInput(blockId, text) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        if (block.type === "todo") {
          return {
            ...block,
            content: {
              ...block.content,
              text,
            },
          };
        }
        return {
          ...block,
          content: {
            ...block.content,
            text,
          },
        };
      }),
    );
  }

  function handleTodoToggle(blockId) {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        return {
          ...block,
          content: {
            ...block.content,
            checked: !block.content?.checked,
          },
        };
      }),
    );
  }

  if (loading || authLoading) {
    return (
      <main className="editor-shell">
        <section className="editor-card">
          <h1>Loading document...</h1>
        </section>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="editor-shell">
        <section className="editor-card">
          <h1>Document not found.</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="editor-shell">
      <section className="editor-card">
        <header className="editor-header">
          <div>
            <p className="eyebrow">Document</p>
            <h1>{document.title}</h1>
          </div>
          <button type="button" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </button>
        </header>

        <div className="editor-blocks">
          {blockList.length === 0 ? (
            <p className="auth-note">No blocks yet. Add your first block.</p>
          ) : null}
          {blockList.map((block) => {
            const isActive = block.id === activeBlockId;
            const label = BLOCK_TYPES[block.type] || block.type;

            if (block.type === "divider") {
              return (
                <div
                  key={block.id}
                  className={`block block-divider ${
                    isActive ? "is-active" : ""
                  }`}
                  onClick={() => handleBlockSelect(block.id)}
                  role="button"
                  tabIndex={0}
                  ref={(node) => {
                    if (node) blockRefs.current.set(block.id, node);
                  }}
                >
                  <span className="block-label">{label}</span>
                  <hr />
                </div>
              );
            }

            if (block.type === "image") {
              return (
                <div
                  key={block.id}
                  className={`block block-image ${
                    isActive ? "is-active" : ""
                  }`}
                  onClick={() => handleBlockSelect(block.id)}
                  role="button"
                  tabIndex={0}
                  ref={(node) => {
                    if (node) blockRefs.current.set(block.id, node);
                  }}
                >
                  <span className="block-label">{label}</span>
                  {block.content?.url ? (
                    <img src={block.content.url} alt={block.content?.alt || ""} />
                  ) : (
                    <div className="image-placeholder">Image URL not set.</div>
                  )}
                </div>
              );
            }

            if (block.type === "todo") {
              return (
                <div
                  key={block.id}
                  className={`block block-todo ${isActive ? "is-active" : ""}`}
                  onClick={() => handleBlockSelect(block.id)}
                >
                  <span className="block-label">{label}</span>
                  <div className="todo-row">
                    <input
                      type="checkbox"
                      checked={Boolean(block.content?.checked)}
                      onChange={() => handleTodoToggle(block.id)}
                    />
                    <div
                      className="block-text"
                      contentEditable
                      suppressContentEditableWarning
                      ref={(node) => {
                        if (node) blockRefs.current.set(block.id, node);
                      }}
                      onFocus={() => handleBlockSelect(block.id)}
                      onInput={(event) =>
                        handleTextInput(block.id, event.currentTarget.textContent)
                      }
                    >
                      {getDisplayText(block)}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={block.id}
                className={`block block-text ${
                  block.type
                } ${isActive ? "is-active" : ""}`}
                onClick={() => handleBlockSelect(block.id)}
              >
                <span className="block-label">{label}</span>
                <div
                  className={`block-text block-${block.type}`}
                  contentEditable
                  suppressContentEditableWarning
                  ref={(node) => {
                    if (node) blockRefs.current.set(block.id, node);
                  }}
                  onFocus={() => handleBlockSelect(block.id)}
                  onInput={(event) =>
                    handleTextInput(block.id, event.currentTarget.textContent)
                  }
                >
                  {getDisplayText(block)}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
