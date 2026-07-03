import { clearToken, getToken } from "./token.js";

function buildApiError(response, bodyText) {
  if (response.status === 404 && bodyText.includes("Cannot GET /api/")) {
    return "API server is missing routes. Stop it and run npm run dev:all again.";
  }

  if (response.status === 404 && bodyText.trim() === "") {
    return "API server is not running. Start it with npm run dev:all.";
  }

  try {
    const body = JSON.parse(bodyText);
    if (body.error) {
      return body.error;
    }
  } catch {
    // Response was not JSON.
  }

  return response.statusText || "Request failed.";
}

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
    const bodyText = await response.text();
    throw new Error(buildApiError(response, bodyText));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
