const express = require("express");

const { prisma } = require("../db/prisma");

const router = express.Router();
const allowedTypes = [
  "paragraph",
  "heading_1",
  "heading_2",
  "todo",
  "code",
  "divider",
  "image",
];

const BASE_GAP = 1000;
const MIN_GAP = 0.001;

function normalizeContent(type, content) {
  const safe = content && typeof content === "object" ? content : {};

  if (type === "todo") {
    return {
      text: typeof safe.text === "string" ? safe.text : "",
      checked: Boolean(safe.checked),
    };
  }

  if (type === "image") {
    return {
      url: typeof safe.url === "string" ? safe.url : "",
      alt: typeof safe.alt === "string" ? safe.alt : "",
    };
  }

  if (type === "divider") {
    return {};
  }

  return {
    text: typeof safe.text === "string" ? safe.text : "",
  };
}

async function requireOwnedDocument(documentId, userId) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, userId: true },
  });

  if (!document) {
    return { ok: false, status: 404, message: "Document not found." };
  }

  if (document.userId !== userId) {
    return { ok: false, status: 403, message: "Forbidden." };
  }

  return { ok: true, document };
}

async function renormalizeOrder(documentId, parentId) {
  const blocks = await prisma.block.findMany({
    where: {
      documentId,
      parentId: parentId ?? null,
    },
    orderBy: { orderIndex: "asc" },
    select: { id: true },
  });

  const updates = blocks.map((block, index) =>
    prisma.block.update({
      where: { id: block.id },
      data: { orderIndex: (index + 1) * BASE_GAP },
    }),
  );

  await prisma.$transaction(updates);
}

function resolveOrderIndex({ before, after }) {
  if (before && after) {
    return (before.orderIndex + after.orderIndex) / 2;
  }
  if (after) {
    return after.orderIndex + BASE_GAP;
  }
  if (before) {
    return before.orderIndex - BASE_GAP;
  }
  return BASE_GAP;
}

async function findNeighborById(id) {
  return prisma.block.findUnique({
    where: { id },
    select: {
      id: true,
      documentId: true,
      parentId: true,
      orderIndex: true,
    },
  });
}

async function computeOrderIndex({ documentId, parentId, beforeId, afterId }) {
  const before = beforeId ? await findNeighborById(beforeId) : null;
  const after = afterId ? await findNeighborById(afterId) : null;

  if (before && before.documentId !== documentId) {
    return { error: "beforeId is not in document." };
  }
  if (after && after.documentId !== documentId) {
    return { error: "afterId is not in document." };
  }

  const expectedParent = parentId ?? null;
  if (before && (before.parentId ?? null) !== expectedParent) {
    return { error: "beforeId parent mismatch." };
  }
  if (after && (after.parentId ?? null) !== expectedParent) {
    return { error: "afterId parent mismatch." };
  }

  let orderIndex = resolveOrderIndex({ before, after });

  if (before && after && Math.abs(after.orderIndex - before.orderIndex) < MIN_GAP) {
    await renormalizeOrder(documentId, expectedParent);
    const refreshedBefore = await findNeighborById(before.id);
    const refreshedAfter = await findNeighborById(after.id);
    orderIndex = resolveOrderIndex({
      before: refreshedBefore,
      after: refreshedAfter,
    });
  }

  return {
    orderIndex,
    expectedParent,
  };
}

router.post("/", async (req, res) => {
  const { documentId, type, content, parentId, beforeId, afterId } =
    req.body || {};

  if (!documentId || !type) {
    return res
      .status(400)
      .json({ message: "documentId and type are required." });
  }

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ message: "Invalid block type." });
  }

  const ownership = await requireOwnedDocument(documentId, req.user.id);
  if (!ownership.ok) {
    return res.status(ownership.status).json({ message: ownership.message });
  }

  const computed = await computeOrderIndex({
    documentId,
    parentId,
    beforeId,
    afterId,
  });
  if (computed.error) {
    return res.status(400).json({ message: computed.error });
  }

  const block = await prisma.block.create({
    data: {
      documentId,
      type,
      content: normalizeContent(type, content),
      orderIndex: computed.orderIndex,
      parentId: computed.expectedParent,
    },
    select: {
      id: true,
      documentId: true,
      type: true,
      content: true,
      orderIndex: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(201).json({ block });
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { type, content } = req.body || {};

  const block = await prisma.block.findUnique({
    where: { id },
    select: { id: true, documentId: true, type: true, content: true },
  });

  if (!block) {
    return res.status(404).json({ message: "Block not found." });
  }

  const ownership = await requireOwnedDocument(block.documentId, req.user.id);
  if (!ownership.ok) {
    return res.status(ownership.status).json({ message: ownership.message });
  }

  if (type && !allowedTypes.includes(type)) {
    return res.status(400).json({ message: "Invalid block type." });
  }

  const nextType = type || block.type;
  const nextContent =
    content !== undefined ? content : block.content;

  const updated = await prisma.block.update({
    where: { id },
    data: {
      ...(type ? { type } : {}),
      content: normalizeContent(nextType, nextContent),
    },
    select: {
      id: true,
      documentId: true,
      type: true,
      content: true,
      orderIndex: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ block: updated });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const block = await prisma.block.findUnique({
    where: { id },
    select: { id: true, documentId: true },
  });

  if (!block) {
    return res.status(404).json({ message: "Block not found." });
  }

  const ownership = await requireOwnedDocument(block.documentId, req.user.id);
  if (!ownership.ok) {
    return res.status(ownership.status).json({ message: ownership.message });
  }

  await prisma.block.delete({ where: { id } });

  return res.status(204).send();
});

router.patch("/:id/order", async (req, res) => {
  const { id } = req.params;
  const { beforeId, afterId, parentId } = req.body || {};

  const block = await prisma.block.findUnique({
    where: { id },
    select: { id: true, documentId: true, parentId: true },
  });

  if (!block) {
    return res.status(404).json({ message: "Block not found." });
  }

  const ownership = await requireOwnedDocument(block.documentId, req.user.id);
  if (!ownership.ok) {
    return res.status(ownership.status).json({ message: ownership.message });
  }

  const computed = await computeOrderIndex({
    documentId: block.documentId,
    parentId: parentId ?? block.parentId ?? null,
    beforeId,
    afterId,
  });

  if (computed.error) {
    return res.status(400).json({ message: computed.error });
  }

  const updated = await prisma.block.update({
    where: { id },
    data: {
      orderIndex: computed.orderIndex,
      parentId: computed.expectedParent,
    },
    select: {
      id: true,
      documentId: true,
      type: true,
      content: true,
      orderIndex: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ block: updated });
});

module.exports = { blocksRouter: router };
