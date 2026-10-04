/**
 * chatApi.js
 * ---------------------------------------------------------------
 * The ONLY module in the frontend that knows how to talk to the
 * backend. No API keys and no AI-provider SDKs live here or
 * anywhere else in src/ — the backend owns that, via its own
 * environment variables.
 *
 * Flow:
 *   React Frontend -> (this file) -> Backend API -> AI Provider
 *   AI Provider -> Backend API -> (this file) -> React Frontend
 * --------------------------------------------------------------- */

const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.REACT_APP_API_BASE_URL) ||
  "http://localhost:5000";

/**
 * Sends the conversation to POST /api/chat and returns the assistant's reply.
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @param {{ signal?: AbortSignal, conversationId?: string }} options
 * @returns {Promise<{ content: string }>}
 */
export async function sendChatMessage(messages, options = {}) {
  const { signal, conversationId, token } = options;

  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages, conversationId }),
      signal,
    });
  } catch (networkError) {
    if (networkError.name === "AbortError") throw networkError;
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

  const data = await response.json();
  return { content: data.content ?? data.message ?? "" };
}

/**
 * DEMO FALLBACK
 * ---------------------------------------------------------------
 * Lets this UI run and be evaluated before a real backend exists.
 * It is intentionally isolated here so it's obvious what to delete
 * once /api/chat is live: remove this function and the try/catch
 * fallback in ChatContext that calls it.
 * --------------------------------------------------------------- */
export async function getMockChatResponse(messages) {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const prompt = lastUserMessage ? lastUserMessage.content : "";

  await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 700));

  const snippets = [
    `Here's a way to think about "${prompt.slice(0, 60)}${prompt.length > 60 ? "…" : ""}":\n\nThis is a simulated response from the demo fallback in \`chatApi.js\`. Once your backend's \`/api/chat\` endpoint is live, real model output will appear here instead.`,
    `Sure — here's a quick code example:\n\n\`\`\`javascript\nfunction greet(name) {\n  return \`Hello, ${"$"}{name}! 👋\`;\n}\n\nconsole.log(greet("world"));\n\`\`\`\n\nLet me know if you'd like it adapted to another language.`,
    `Good question. Breaking it down:\n\n1. Start with the core idea\n2. Validate it against a real example\n3. Iterate based on what you learn\n\nWant me to go deeper on any of these steps?`,
  ];

  const content = snippets[Math.floor(Math.random() * snippets.length)];
  return { content };
}
