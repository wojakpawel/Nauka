import { api } from "./client.js";
import { clearToken, setToken } from "./token.js";

export async function register(username, password) {
  const data = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data;
}

export async function login(username, password) {
  const data = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data;
}

export function logout() {
  clearToken();
}

export async function getMe() {
  return api("/api/auth/me");
}
