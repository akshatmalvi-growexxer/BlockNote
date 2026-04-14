const express = require("express");

const { prisma } = require("../db/prisma");

const router = express.Router();

router.get("/:token", async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ message: "Share token missing." });
  }

  const document = await prisma.document.findFirst({
    where: {
      shareToken: token,
      isPublic: true,
    },
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
    return res.status(404).json({ message: "Shared document not found." });
  }

  return res.status(200).json({
    document: {
      id: document.id,
      title: document.title,
      updatedAt: document.updatedAt,
      createdAt: document.createdAt,
      blocks: document.blocks,
    },
  });
});

module.exports = { shareRouter: router };
