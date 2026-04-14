const crypto = require("crypto");

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

function randomEmail(prefix) {
  const id = crypto.randomBytes(4).toString("hex");
  return `${prefix}.${id}@example.com`;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
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

async function run() {
  const results = [];
  const password = "Password1";

  const userA = randomEmail("usera");
  const userB = randomEmail("userb");

  const tokenA = await registerUser(userA, password);
  const tokenB = await registerUser(userB, password);

  const doc = await createDocument(tokenA);

  // A can fetch its document
  {
    const { response } = await request(`/documents/${doc.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    results.push({
      name: "Owner can fetch document",
      ok: response.status === 200,
      status: response.status,
    });
  }

  // B gets 403
  {
    const { response } = await request(`/documents/${doc.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    results.push({
      name: "Non-owner gets 403",
      ok: response.status === 403,
      status: response.status,
    });
  }

  // Protected route without auth returns 401
  {
    const { response } = await request("/documents");
    results.push({
      name: "Protected route requires auth",
      ok: response.status === 401,
      status: response.status,
    });
  }

  // Share token should not allow write routes
  let shareToken = null;
  {
    const { response, body } = await request(`/documents/${doc.id}/share`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (response.ok) {
      shareToken = body.document.shareToken;
    }
  }

  {
    const { response } = await request("/blocks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenA}`,
        "x-share-token": shareToken || "missing",
      },
      body: JSON.stringify({
        documentId: doc.id,
        type: "paragraph",
        content: { text: "Should be rejected" },
      }),
    });
    results.push({
      name: "Share token rejected on write",
      ok: response.status === 403,
      status: response.status,
    });
  }

  let failed = false;
  for (const result of results) {
    if (!result.ok) {
      failed = true;
      console.error(
        `FAIL: ${result.name} (status ${result.status})`,
      );
    } else {
      console.log(`PASS: ${result.name}`);
    }
  }

  if (failed) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error("Security tests failed to run:", error.message);
  process.exitCode = 1;
});
