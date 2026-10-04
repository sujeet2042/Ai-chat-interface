/**
 * authApi.js
 * ---------------------------------------------------------------
 * The ONLY module that talks to the backend's auth endpoints.
 * No password hashing, tokens, or secrets are ever generated here —
 * this file just forwards credentials to the backend and returns
 * whatever it responds with.
 *
 *   React Frontend -> (this file) -> Backend API -> user database
 * --------------------------------------------------------------- */

const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.REACT_APP_API_BASE_URL) ||
  "http://localhost:5000";

async function postJson(path, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (networkError) {
    const err = new Error(networkError.message || "Failed to reach backend server.");
    err.isNetworkError = true;
    throw err;
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      message = errorBody.error || errorBody.message || message;
    } catch (_) {
      /* response wasn't JSON — keep the default message */
    }
    const err = new Error(message);
    err.status = response.status;
    err.isBackendError = true;
    throw err;
  }

  return response.json();
}

export async function loginRequest({ email, password }) {
  const data = await postJson("/api/auth/login", { email, password });
  return { user: data.user, token: data.token };
}

export async function signupRequest({ name, email, password }) {
  const data = await postJson("/api/auth/signup", { name, email, password });
  return { user: data.user, token: data.token };
}

export async function getMeRequest(token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (networkError) {
    const err = new Error(networkError.message || "Failed to reach backend server.");
    err.isNetworkError = true;
    throw err;
  }

  if (!response.ok) {
    const err = new Error(`Session invalid (${response.status})`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.user;
}

export async function logoutRequest(token) {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).catch(() => {
    /* best-effort — the frontend clears local session regardless */
  });
}

/**
 * DEMO FALLBACK
 * ---------------------------------------------------------------
 * Lets sign up / sign in / sign out be fully testable before a real
 * backend exists. Accounts are kept in localStorage on this device
 * only — this is NOT secure and NOT how real auth should work.
 * Delete this section (and the try/catch fallbacks in AuthContext
 * that call it) once /api/auth/* is live on a real backend.
 * --------------------------------------------------------------- */
const DEMO_USERS_KEY = "ai-assistant.demo-users";

function loadDemoUsers() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_USERS_KEY)) || [];
  } catch (_) {
    return [];
  }
}

function saveDemoUsers(users) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

export async function mockSignup({ name, email, password }) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const users = loadDemoUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("An account with that email already exists.");
  }
  const user = { id: `demo-${Date.now()}`, name, email };
  users.push({ ...user, password }); // demo only — never store plaintext passwords for real
  saveDemoUsers(users);
  return { user, token: `demo-token-${user.id}` };
}

export async function mockLogin({ email, password }) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const users = loadDemoUsers();
  const match = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!match) {
    throw new Error("Invalid email or password.");
  }
  const { password: _password, ...user } = match;
  return { user, token: `demo-token-${user.id}` };
}
