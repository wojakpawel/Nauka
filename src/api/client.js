import { clearToken, getToken } from "./token.js";

export async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || response.statusText);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
