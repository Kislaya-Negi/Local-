function getDefaultApiUrl() {
  if (typeof window !== "undefined") {
    const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (isLocalHost) {
      return "http://localhost:4000/api";
    }
  }

  return "/api";
}

const rawBase = import.meta.env.VITE_API_URL || getDefaultApiUrl();
const API_URL = String(rawBase).trim().replace(/\/+$/, "");

export async function apiFetch(path, { token, method, body } = {}) {
  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  let res;
  try {
    res = await fetch(url, {
      method: method ?? (body ? "POST" : "GET"),
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      mode: "cors",
    });
  } catch (e) {
    const hint =
      e instanceof TypeError
        ? `Cannot reach API at ${API_URL}. Set VITE_API_URL if needed and make sure the backend is running.`
        : e?.message || "Network error";
    const err = new Error(hint);
    err.cause = e;
    throw err;
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
