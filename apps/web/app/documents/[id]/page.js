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

function getCaretOffset(node) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!node.contains(range.startContainer)) return null;
  const preRange = range.cloneRange();
  preRange.selectNodeContents(node);
  preRange.setEnd(range.startContainer, range.startOffset);
  return preRange.toString().length;
}

function placeCaret(node, atEnd) {
  if (!node) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(!atEnd);
  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  selection.addRange(range);
}

function syncEditableText(node, text, isActive) {
  if (!node) return;
  const nextText = text ?? "";
  if (!isActive || node.textContent === "") {
    if (node.textContent !== nextText) {
      node.textContent = nextText;
    }
  }
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
        const incomingBlocks = data.document.blocks || [];
        if (incomingBlocks.length === 0) {
          const created = await apiRequest("/blocks", {
            method: "POST",
            body: JSON.stringify({
              documentId,
              type: "paragraph",
              content: { text: "" },
            }),
          });
          const seededBlock = created.block;
          setBlocks([seededBlock]);
          setActiveBlockId(seededBlock.id);
        } else {
          setBlocks(incomingBlocks);
          setActiveBlockId(incomingBlocks[0].id);
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
        if (block.type === "image") {
          return {
            ...block,
            content: {
              ...block.content,
              url: text,
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

  function updateBlockContent(blockId, nextContent) {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              content: {
                ...block.content,
                ...nextContent,
              },
            }
          : block,
      ),
    );
  }

  function insertBlockAfter(index, newBlock) {
    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, newBlock);
      return next;
    });
  }

  function removeBlockById(blockId) {
    setBlocks((prev) => prev.filter((block) => block.id !== blockId));
  }

  function findPreviousFocusableIndex(index, list) {
    for (let i = index - 1; i >= 0; i -= 1) {
      const candidate = list[i];
      if (candidate.type !== "divider" && candidate.type !== "image") {
        return i;
      }
    }
    return null;
  }

  async function handleEnter(block, index, node) {
    const text = node.textContent || "";
    const caretOffset = getCaretOffset(node) ?? text.length;
    const beforeText = text.slice(0, caretOffset);
    const afterText = text.slice(caretOffset);
    const nextBlock = blocks[index + 1];

    if (caretOffset < text.length) {
      node.textContent = beforeText;
      updateBlockContent(block.id, { text: beforeText });
      await apiRequest(`/blocks/${block.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          content:
            block.type === "todo"
              ? { text: beforeText, checked: Boolean(block.content?.checked) }
              : { text: beforeText },
        }),
      });
    }

    const created = await apiRequest("/blocks", {
      method: "POST",
      body: JSON.stringify({
        documentId,
        type: "paragraph",
        content: { text: afterText },
        parentId: block.parentId ?? null,
        beforeId: block.id,
        afterId: nextBlock?.id,
      }),
    });

    insertBlockAfter(index, created.block);
    setActiveBlockId(created.block.id);

    setTimeout(() => {
      const newNode = blockRefs.current.get(created.block.id);
      if (newNode) {
        newNode.focus();
        placeCaret(newNode, false);
      }
    }, 0);
  }

  async function handleBackspace(block, index, node) {
    const text = node.textContent || "";
    const caretOffset = getCaretOffset(node) ?? 0;
    const isAtStart = caretOffset === 0;

    if (!isAtStart) return;

    if (text.length > 0) {
      return;
    }

    if (index === 0) {
      return;
    }

    const previousIndex = findPreviousFocusableIndex(index, blocks);
    const previousBlock =
      previousIndex !== null ? blocks[previousIndex] : null;

    await apiRequest(`/blocks/${block.id}`, { method: "DELETE" });
    removeBlockById(block.id);

    if (previousBlock) {
      setActiveBlockId(previousBlock.id);
      setTimeout(() => {
        const prevNode = blockRefs.current.get(previousBlock.id);
        if (prevNode) {
          prevNode.focus();
          placeCaret(prevNode, true);
        }
      }, 0);
    }
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
          {blockList.map((block, index) => {
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
                  <input
                    className="image-input"
                    placeholder="Paste image URL..."
                    value={block.content?.url || ""}
                    onChange={(event) =>
                      handleTextInput(block.id, event.target.value)
                    }
                    onFocus={() => handleBlockSelect(block.id)}
                  />
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
                        if (node) {
                          blockRefs.current.set(block.id, node);
                          syncEditableText(node, getDisplayText(block), isActive);
                        }
                      }}
                      onFocus={() => handleBlockSelect(block.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleEnter(block, index, event.currentTarget);
                        }
                        if (event.key === "Backspace") {
                          if (getCaretOffset(event.currentTarget) === 0) {
                            event.preventDefault();
                            handleBackspace(block, index, event.currentTarget);
                          }
                        }
                      }}
                      onInput={(event) =>
                        handleTextInput(block.id, event.currentTarget.textContent)
                      }
                    >
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
                    if (node) {
                      blockRefs.current.set(block.id, node);
                      syncEditableText(node, getDisplayText(block), isActive);
                    }
                  }}
                  onFocus={() => handleBlockSelect(block.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleEnter(block, index, event.currentTarget);
                    }
                    if (event.key === "Backspace") {
                      if (getCaretOffset(event.currentTarget) === 0) {
                        event.preventDefault();
                        handleBackspace(block, index, event.currentTarget);
                      }
                    }
                  }}
                  onInput={(event) =>
                    handleTextInput(block.id, event.currentTarget.textContent)
                  }
                >
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
