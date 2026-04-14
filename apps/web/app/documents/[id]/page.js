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

const SLASH_OPTIONS = [
  { type: "paragraph", label: "Paragraph" },
  { type: "heading_1", label: "Heading 1" },
  { type: "heading_2", label: "Heading 2" },
  { type: "todo", label: "To-do" },
  { type: "code", label: "Code" },
  { type: "divider", label: "Divider" },
  { type: "image", label: "Image" },
];

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

function insertTextAtCaret(node, text) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
  selection.removeAllRanges();
  selection.addRange(range);
  node.normalize();
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

function focusBlockNode(node, atEnd = false) {
  if (!node) return;
  if (node.classList?.contains("block")) {
    const imageInput = node.querySelector?.(".image-input");
    if (imageInput) {
      imageInput.focus();
      return;
    }
  }
  if (typeof node.focus === "function") {
    node.focus();
    placeCaret(node, atEnd);
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
  const [slashMenu, setSlashMenu] = useState({
    open: false,
    blockId: null,
    query: "",
  });
  const [saveState, setSaveState] = useState("idle");
  const [dragId, setDragId] = useState(null);
  const blockRefs = useRef(new Map());
  const blocksRef = useRef([]);
  const saveTimers = useRef(new Map());
  const saveControllers = useRef(new Map());
  const saveSeq = useRef(new Map());
  const scheduledSaves = useRef(new Set());
  const pendingSaves = useRef(new Set());

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
            setSaveState("saved");
          } else {
            setBlocks(incomingBlocks);
            setActiveBlockId(incomingBlocks[0].id);
            setSaveState("saved");
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

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  const blockList = useMemo(() => blocks, [blocks]);

  function handleBlockSelect(blockId) {
    if (slashMenu.open && slashMenu.blockId !== blockId) {
      setSlashMenu({ open: false, blockId: null, query: "" });
    }
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
    scheduleBlockSave(blockId);
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
    scheduleBlockSave(blockId);
  }

  function updateBlockType(blockId, nextType, nextContent) {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              type: nextType,
              content: nextContent,
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

  function moveBlock(fromIndex, toIndex) {
    setBlocks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
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

  function getEmptyContentForType(type) {
    if (type === "todo") return { text: "", checked: false };
    if (type === "image") return { url: "", alt: "" };
    if (type === "divider") return {};
    return { text: "" };
  }

  function openSlashMenuFor(blockId) {
    setSlashMenu({ open: true, blockId, query: "" });
  }

  function closeSlashMenu(clearBlockId) {
    setSlashMenu({ open: false, blockId: null, query: "" });
    if (clearBlockId) {
      updateBlockContent(clearBlockId, { text: "" });
    }
  }

  async function selectSlashOption(block, option) {
    const nextContent = getEmptyContentForType(option.type);
    updateBlockType(block.id, option.type, nextContent);
    await apiRequest(`/blocks/${block.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        type: option.type,
        content: nextContent,
      }),
    });
    closeSlashMenu(block.id);
    setActiveBlockId(block.id);
    setTimeout(() => {
      const node = blockRefs.current.get(block.id);
      if (node) {
        focusBlockNode(node, false);
      }
    }, 0);
  }

  function getSlashMatches() {
    if (!slashMenu.open) return [];
    const query = slashMenu.query.toLowerCase();
    if (!query) return SLASH_OPTIONS;
    return SLASH_OPTIONS.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.type.toLowerCase().includes(query),
    );
  }

  function handleSlashKey(event, block) {
    if (!slashMenu.open || slashMenu.blockId !== block.id) return false;

    if (event.key === "Escape") {
      event.preventDefault();
      closeSlashMenu(block.id);
      return true;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      setSlashMenu((prev) => {
        if (!prev.query) {
          return { open: false, blockId: null, query: "" };
        }
        return { ...prev, query: prev.query.slice(0, -1) };
      });
      return true;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const matches = getSlashMatches();
      if (matches.length) {
        selectSlashOption(block, matches[0]);
      } else {
        closeSlashMenu(block.id);
      }
      return true;
    }

    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      setSlashMenu((prev) => ({
        ...prev,
        query: `${prev.query}${event.key}`,
      }));
      return true;
    }

    return false;
  }

  async function handleEnter(block, index, node) {
    if (slashMenu.open && slashMenu.blockId === block.id) {
      const matches = getSlashMatches();
      if (matches.length) {
        await selectSlashOption(block, matches[0]);
      } else {
        closeSlashMenu(block.id);
      }
      return;
    }
    const text = node.textContent || "";
    const caretOffset = getCaretOffset(node) ?? text.length;
    const beforeText = text.slice(0, caretOffset);
    const afterText = text.slice(caretOffset);
    const nextBlock = blocks[index + 1];
    const nextType = "paragraph";

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
        type: nextType,
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
    scheduleBlockSave(blockId);
  }

  function scheduleBlockSave(blockId) {
    scheduledSaves.current.add(blockId);
    setSaveState("saving");
    const existingTimer = saveTimers.current.get(blockId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    const timer = setTimeout(() => {
      saveBlock(blockId);
    }, 1000);
    saveTimers.current.set(blockId, timer);
  }

  async function saveBlock(blockId) {
    const block = blocksRef.current.find((item) => item.id === blockId);
    if (!block) {
      scheduledSaves.current.delete(blockId);
      return;
    }

    scheduledSaves.current.delete(blockId);
    pendingSaves.current.add(blockId);

    const previousController = saveControllers.current.get(blockId);
    if (previousController) {
      previousController.abort();
    }
    const controller = new AbortController();
    saveControllers.current.set(blockId, controller);

    const nextSeq = (saveSeq.current.get(blockId) || 0) + 1;
    saveSeq.current.set(blockId, nextSeq);

    try {
      await apiRequest(`/blocks/${blockId}`, {
        method: "PATCH",
        body: JSON.stringify({
          content: block.content,
        }),
        signal: controller.signal,
      });
      if (saveSeq.current.get(blockId) !== nextSeq) {
        return;
      }
      pendingSaves.current.delete(blockId);
      if (
        scheduledSaves.current.size === 0 &&
        pendingSaves.current.size === 0
      ) {
        setSaveState("saved");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        setSaveState("error");
        pendingSaves.current.delete(blockId);
      }
    }
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
            <p className="save-state">
              {saveState === "saving"
                ? "Saving..."
                : saveState === "error"
                  ? "Save failed"
                  : "Saved"}
            </p>
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
            const showSlashMenu =
              slashMenu.open && slashMenu.blockId === block.id;
            const slashMatches = showSlashMenu ? getSlashMatches() : [];

            function handleDragStart(event) {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", block.id);
              setDragId(block.id);
            }

            function handleDragOver(event) {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }

            async function handleDrop() {
              if (!dragId || dragId === block.id) {
                setDragId(null);
                return;
              }

              const fromIndex = blockList.findIndex((item) => item.id === dragId);
              const toIndex = blockList.findIndex((item) => item.id === block.id);
              if (fromIndex === -1 || toIndex === -1) {
                setDragId(null);
                return;
              }

              moveBlock(fromIndex, toIndex);

              const nextOrder = [...blockList];
              const [moved] = nextOrder.splice(fromIndex, 1);
              nextOrder.splice(toIndex, 0, moved);

              const before = toIndex > 0 ? nextOrder[toIndex - 1] : null;
              const after =
                toIndex < nextOrder.length - 1 ? nextOrder[toIndex + 1] : null;

              await apiRequest(`/blocks/${dragId}/order`, {
                method: "PATCH",
                body: JSON.stringify({
                  beforeId: before?.id,
                  afterId: after?.id,
                }),
              });

              setDragId(null);
            }

            if (block.type === "divider") {
              return (
                <div
                  key={block.id}
                  className={`block block-divider ${
                    isActive ? "is-active" : ""
                  }`}
                  onClick={() => handleBlockSelect(block.id)}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  ref={(node) => {
                    if (node) blockRefs.current.set(block.id, node);
                  }}
                >
                  <span
                    className="block-handle"
                    draggable
                    onDragStart={handleDragStart}
                  >
                    ::
                  </span>
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
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  ref={(node) => {
                    if (node) blockRefs.current.set(block.id, node);
                  }}
                >
                  <span
                    className="block-handle"
                    draggable
                    onDragStart={handleDragStart}
                  >
                    ::
                  </span>
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
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <span
                    className="block-handle"
                    draggable
                    onDragStart={handleDragStart}
                  >
                    ::
                  </span>
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
                        if (handleSlashKey(event, block)) {
                          return;
                        }
                        if (
                          event.key === "/" &&
                          (event.currentTarget.textContent || "") === "" &&
                          (getCaretOffset(event.currentTarget) ?? 0) === 0
                        ) {
                          event.preventDefault();
                          openSlashMenuFor(block.id);
                          return;
                        }
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
                  {showSlashMenu ? (
                    <div className="slash-menu">
                      {slashMatches.length ? (
                        slashMatches.map((option) => (
                          <button
                            key={option.type}
                            type="button"
                            className="slash-item"
                            onClick={() => selectSlashOption(block, option)}
                          >
                            {option.label}
                          </button>
                        ))
                      ) : (
                        <div className="slash-empty">No matches</div>
                      )}
                    </div>
                  ) : null}
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
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <span
                  className="block-handle"
                  draggable
                  onDragStart={handleDragStart}
                >
                  ::
                </span>
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
                    if (handleSlashKey(event, block)) {
                      return;
                    }
                    if (
                      event.key === "/" &&
                      (event.currentTarget.textContent || "") === "" &&
                      (getCaretOffset(event.currentTarget) ?? 0) === 0
                    ) {
                      event.preventDefault();
                      openSlashMenuFor(block.id);
                      return;
                    }
                    if (block.type === "code" && event.key === "Tab") {
                      event.preventDefault();
                      insertTextAtCaret(event.currentTarget, "  ");
                      handleTextInput(
                        block.id,
                        event.currentTarget.textContent,
                      );
                      return;
                    }
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
                {showSlashMenu ? (
                  <div className="slash-menu">
                    {slashMatches.length ? (
                      slashMatches.map((option) => (
                        <button
                          key={option.type}
                          type="button"
                          className="slash-item"
                          onClick={() => selectSlashOption(block, option)}
                        >
                          {option.label}
                        </button>
                      ))
                    ) : (
                      <div className="slash-empty">No matches</div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
