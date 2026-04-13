const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getAccessToken() {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split("; ")
    .find((item) => item.startsWith("bn_access="));
  if (!entry) return null;
  return entry.split("=")[1] || null;
}

async function apiRequest(path, options = {}) {
  const accessToken = getAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.message || "Request failed.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export { apiRequest };
