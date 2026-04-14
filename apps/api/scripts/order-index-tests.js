const crypto = require("crypto");

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";
const MIN_GAP = 0.001;
const DEBUG = process.env.DEBUG_TESTS === "1";

function randomEmail(prefix) {
  const id = crypto.randomBytes(4).toString("hex");
  return `${prefix}.${id}@example.com`;
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (_) {
    body = text;
  }

  return { response, body };
}

async function registerUser(email, password) {
  const { response, body } = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error(`Register failed (${response.status}): ${body?.message || body}`);
  }
  return body.accessToken;
}

async function createDocument(token) {
  const { response, body } = await request("/documents", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Create doc failed (${response.status}): ${body?.message || body}`);
  }
  return body.document;
}

async function createBlock(token, payload) {
  if (DEBUG) {
    console.log("Creating block payload:", payload);
  }
  const { response, body } = await request("/blocks", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Create block failed (${response.status}): ${body?.message || body}`);
  }
  return body.block;
}

async function fetchDocument(token, id) {
  const { response, body } = await request(`/documents/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Fetch doc failed (${response.status}): ${body?.message || body}`);
  }
  return body.document;
}

function assertAscending(blocks) {
  for (let i = 1; i < blocks.length; i += 1) {
    if (blocks[i].orderIndex <= blocks[i - 1].orderIndex) {
      return false;
    }
  }
  return true;
}

function minGap(blocks) {
  let gap = Number.POSITIVE_INFINITY;
  for (let i = 1; i < blocks.length; i += 1) {
    const diff = blocks[i].orderIndex - blocks[i - 1].orderIndex;
    if (diff < gap) gap = diff;
  }
  return gap;
}

async function run() {
  const password = "Password1";
  const token = await registerUser(randomEmail("order"), password);
  const doc = await createDocument(token);

  let document = await fetchDocument(token, doc.id);
  let baseBlock = document.blocks[document.blocks.length - 1];
  if (!baseBlock) {
    baseBlock = await createBlock(token, {
      documentId: doc.id,
      type: "paragraph",
      content: { text: "first" },
    });
  }

  await createBlock(token, {
    documentId: doc.id,
    type: "paragraph",
    content: { text: "second" },
    beforeId: baseBlock.id,
  });

  document = await fetchDocument(token, doc.id);
  if (!assertAscending(document.blocks)) {
    throw new Error("Order index is not ascending after initial inserts.");
  }

  // Repeatedly insert between the two smallest-order blocks to shrink gaps.
  for (let i = 0; i < 25; i += 1) {
    document = await fetchDocument(token, doc.id);
    const blocks = document.blocks;
    if (blocks.length < 2) {
      throw new Error("Not enough blocks to test ordering.");
    }
    const before = blocks[0];
    const after = blocks[1];
    await createBlock(token, {
      documentId: doc.id,
      type: "paragraph",
      content: { text: `mid-${i}` },
      beforeId: before.id,
      afterId: after.id,
    });
  }

  document = await fetchDocument(token, doc.id);

  if (!assertAscending(document.blocks)) {
    throw new Error("Order index is not ascending after repeated inserts.");
  }

  const gap = minGap(document.blocks);
  if (gap < MIN_GAP) {
    throw new Error(
      `Minimum gap ${gap} is below threshold ${MIN_GAP}. Renormalization did not run.`,
    );
  }

  console.log("PASS: order_index stays ascending and renormalizes as needed");
}

run().catch((error) => {
  console.error("Order index tests failed:", error.message);
  process.exitCode = 1;
});
