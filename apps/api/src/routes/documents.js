const express = require("express");

const { prisma } = require("../db/prisma");

const router = express.Router();

router.get("/", async (req, res) => {
  const documents = await prisma.document.findMany({
    where: { userId: req.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  return res.status(200).json({ documents });
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      blocks: {
        orderBy: { orderIndex: "asc" },
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
      },
    },
  });

  if (!document) {
    return res.status(404).json({ message: "Document not found." });
  }

  if (document.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden." });
  }

  return res.status(200).json({
    document: {
      id: document.id,
      title: document.title,
      isPublic: document.isPublic,
      shareToken: document.shareToken,
      updatedAt: document.updatedAt,
      createdAt: document.createdAt,
      blocks: document.blocks,
    },
  });
});

router.post("/", async (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";

  const [document] = await prisma.$transaction(async (tx) => {
    const created = await tx.document.create({
      data: {
        userId: req.user.id,
        title: title || "Untitled",
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    await tx.block.create({
      data: {
        documentId: created.id,
        type: "paragraph",
        content: { text: "" },
        orderIndex: 1000,
      },
    });

    return [created];
  });

  return res.status(201).json({ document });
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";

  if (!title) {
    return res.status(400).json({ message: "Title cannot be empty." });
  }

  const existing = await prisma.document.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!existing) {
    return res.status(404).json({ message: "Document not found." });
  }

  if (existing.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden." });
  }

  const updated = await prisma.document.update({
    where: { id },
    data: { title },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  return res.status(200).json({ document: updated });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.document.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!existing) {
    return res.status(404).json({ message: "Document not found." });
  }

  if (existing.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden." });
  }

  await prisma.document.delete({ where: { id } });

  return res.status(204).send();
});

router.post("/:id/share", async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.document.findUnique({
    where: { id },
    select: { id: true, userId: true, shareToken: true },
  });

  if (!existing) {
    return res.status(404).json({ message: "Document not found." });
  }

  if (existing.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden." });
  }

  const token =
    existing.shareToken ||
    require("crypto").randomBytes(24).toString("base64url");

  const updated = await prisma.document.update({
    where: { id },
    data: {
      isPublic: true,
      shareToken: token,
    },
    select: {
      id: true,
      title: true,
      isPublic: true,
      shareToken: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ document: updated });
});

router.delete("/:id/share", async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.document.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!existing) {
    return res.status(404).json({ message: "Document not found." });
  }

  if (existing.userId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden." });
  }

  const updated = await prisma.document.update({
    where: { id },
    data: {
      isPublic: false,
      shareToken: null,
    },
    select: {
      id: true,
      title: true,
      isPublic: true,
      shareToken: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ document: updated });
});

module.exports = { documentsRouter: router };
