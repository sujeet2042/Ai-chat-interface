const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const requireAuth = require("./middleware/auth");

const app = express();

const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5000",
  process.env.FRONTEND_URL,
].filter(Boolean);

// =====================================================
// DATABASE
// =====================================================

connectDB();

// =====================================================
// SECURITY & MIDDLEWARE
// =====================================================

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl) or if origin is in whitelist
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // In local development, permit request to avoid blocking
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

// =====================================================
// BASIC ROUTES
// =====================================================

app.get("/", (_req, res) => {
  res.json({
    status: "success",
    message: "AI Chat Interface backend is running",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// AUTH ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

// =====================================================
// CHAT RATE LIMIT
// =====================================================

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many chat requests. Please try again later.",
  },
});

// =====================================================
// CHAT API
// =====================================================

app.post(
  "/api/chat",
  requireAuth,
  chatLimiter,
  async (req, res) => {
    try {
      const { messages } = req.body || {};

      // ---------------------------------------------
      // Validate messages
      // ---------------------------------------------

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: "messages must be a non-empty array",
        });
      }

      if (messages.length > 50) {
        return res.status(400).json({
          error: "Maximum 50 messages are allowed.",
        });
      }

      // ---------------------------------------------
      // Validate individual messages
      // ---------------------------------------------

      for (const message of messages) {
        if (!message || typeof message !== "object") {
          return res.status(400).json({
            error: "Invalid message format.",
          });
        }

        if (!["user", "assistant"].includes(message.role)) {
          return res.status(400).json({
            error: "Invalid message role.",
          });
        }

        if (
          typeof message.content !== "string" ||
          message.content.trim().length === 0
        ) {
          return res.status(400).json({
            error: "Message content cannot be empty.",
          });
        }

        if (message.content.length > 10000) {
          return res.status(400).json({
            error: "Each message must be less than 10,000 characters.",
          });
        }
      }

      // ---------------------------------------------
      // RESOLVE AI PROVIDER & KEYS
      // ---------------------------------------------

      function cleanKey(val) {
        if (!val) return "";
        let s = val.trim();
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
          s = s.slice(1, -1).trim();
        }
        return s;
      }

      const groqKey = cleanKey(process.env.GROQ_API_KEY || process.env.GROQ_KEY || "");
      const genericKey = cleanKey(process.env.AI_API_KEY || "");
      const geminiKey = cleanKey(process.env.GEMINI_API_KEY || "");
      const openAiKey = cleanKey(process.env.OPENAI_API_KEY || "");
      const openRouterKey = cleanKey(process.env.OPENROUTER_API_KEY || "");
      const anthropicKey = cleanKey(process.env.ANTHROPIC_API_KEY || "");

      function detectProvider(key) {
        if (!key) return null;
        if (key.startsWith("AIzaSy")) return "gemini";
        if (key.startsWith("gsk_")) return "groq";
        if (key.startsWith("sk-or-")) return "openrouter";
        if (key.startsWith("sk-ant-")) return "anthropic";
        if (key.startsWith("sk-proj-") || key.startsWith("sk-")) return "openai";
        return null;
      }

      // 1. Resolve Provider (Defaults to "groq")
      let provider = (process.env.AI_PROVIDER || "").toLowerCase().trim();
      if (!provider) {
        provider = "groq";
      }

      let activeKey = "";

      if (provider === "groq") {
        activeKey = groqKey || (genericKey.startsWith("gsk_") ? genericKey : "");
        if (!activeKey) {
          console.warn("[Groq] GROQ_API_KEY is not set or empty in backend/.env");
          return res.status(400).json({
            error: "GROQ_API_KEY is missing! Please paste your Groq API key (starts with 'gsk_') in backend/.env after 'GROQ_API_KEY=' and save the file.",
          });
        }
      } else if (provider === "gemini") {
        activeKey = geminiKey || (genericKey.startsWith("AIzaSy") ? genericKey : "");
        if (!activeKey) {
          return res.status(400).json({
            error: "GEMINI_API_KEY is missing in backend/.env.",
          });
        }
      } else if (provider === "openai") {
        activeKey = openAiKey || (genericKey.startsWith("sk-") && !genericKey.startsWith("sk-ant-") ? genericKey : "");
        if (!activeKey) {
          return res.status(400).json({
            error: "OPENAI_API_KEY is missing in backend/.env.",
          });
        }
      } else if (provider === "openrouter") {
        activeKey = openRouterKey || genericKey;
      } else if (provider === "anthropic") {
        activeKey = anthropicKey || (genericKey.startsWith("sk-ant-") ? genericKey : "");
        if (!activeKey) {
          return res.status(400).json({
            error: "ANTHROPIC_API_KEY is missing in backend/.env.",
          });
        }
      } else {
        provider = "groq";
        activeKey = groqKey;
      }

      if (!activeKey) {
        return res.status(400).json({
          error: "No AI API key found. Please add GROQ_API_KEY in backend/.env.",
        });
      }

      // 2. Resolve Model (Defaults to llama-3.3-70b-versatile for Groq)
      const defaultModels = {
        groq: "llama-3.3-70b-versatile",
        gemini: "gemini-2.0-flash",
        openai: "gpt-4o-mini",
        openrouter: "google/gemini-2.0-flash-exp:free",
        anthropic: "claude-3-5-sonnet-20241022",
      };

      let modelName = (process.env.AI_MODEL || "").trim();
      const defaultModel = defaultModels[provider] || "llama-3.3-70b-versatile";

      if (!modelName) {
        modelName = defaultModel;
      } else if (
        provider === "groq" &&
        (modelName.startsWith("gemini") || modelName.startsWith("gpt") || modelName.startsWith("claude"))
      ) {
        console.log(`[Groq] Model "${modelName}" is not a Groq model. Falling back to "${defaultModel}".`);
        modelName = defaultModel;
      } else if (provider === "gemini" && !modelName.startsWith("gemini")) {
        modelName = defaultModel;
      } else if (provider === "openai" && (modelName.startsWith("gemini") || modelName.startsWith("llama"))) {
        modelName = defaultModel;
      }

      let content = "";

      // ---------------------------------------------------------------
      // 1. GROQ METHOD (100% Free, Ultra Fast - Dedicated Handler)
      // ---------------------------------------------------------------
      if (provider === "groq") {
        console.log(`[Groq API] Sending chat completion with model: ${modelName}`);

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });

        if (!response.ok) {
          const detail = await response.text();
          console.error("Groq API error:", response.status, detail);
          let errorMsg = `Groq API error (${response.status})`;
          try {
            const parsed = JSON.parse(detail);
            if (parsed?.error?.message) errorMsg = parsed.error.message;
          } catch (_) { }
          return res.status(502).json({ error: errorMsg });
        }

        const data = await response.json();
        content = data.choices?.[0]?.message?.content || "";
      }

      // ---------------------------------------------------------------
      // 2. GOOGLE GEMINI (Free tier available at aistudio.google.com)
      // ---------------------------------------------------------------
      else if (provider === "gemini") {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

        const geminiContents = messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": activeKey,
          },
          body: JSON.stringify({ contents: geminiContents }),
        });

        if (!response.ok) {
          const detail = await response.text();
          console.error("Gemini API error:", response.status);
          let errorMsg = `Gemini API error (${response.status})`;
          try {
            const parsed = JSON.parse(detail);
            if (parsed?.error?.message) errorMsg = parsed.error.message;
          } catch (_) { }
          return res.status(502).json({ error: errorMsg });
        }

        const data = await response.json();
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }

      // ---------------------------------------------------------------
      // 3. OPENAI / OPENROUTER (OpenAI-compatible)
      // ---------------------------------------------------------------
      else if (provider === "openai" || provider === "openrouter") {
        let endpoint = "https://api.openai.com/v1/chat/completions";

        if (provider === "openrouter" || activeKey.startsWith("sk-or-")) {
          endpoint = "https://openrouter.ai/api/v1/chat/completions";
        }

        const url = process.env.OPENAI_BASE_URL || endpoint;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeKey}`,
            ...(provider === "openrouter" || activeKey.startsWith("sk-or-")
              ? {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI Chat Interface",
              }
              : {}),
          },
          body: JSON.stringify({
            model: modelName,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!response.ok) {
          const detail = await response.text();
          console.error("OpenAI-compatible API error:", response.status);
          let errorMsg = `API error (${response.status})`;
          try {
            const parsed = JSON.parse(detail);
            if (parsed?.error?.message) errorMsg = parsed.error.message;
          } catch (_) { }
          return res.status(502).json({ error: errorMsg });
        }

        const data = await response.json();
        content = data.choices?.[0]?.message?.content || "";
      }

      // ---------------------------------------------
      // 3. ANTHROPIC CLAUDE
      // ---------------------------------------------
      else {
        const response = await fetch(
          "https://api.anthropic.com/v1/messages",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": activeKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: modelName,
              max_tokens: 1024,
              messages: messages.map((message) => ({
                role: message.role,
                content: message.content,
              })),
            }),
          }
        );

        if (!response.ok) {
          const detail = await response.text();
          console.error("Anthropic API error:", response.status);

          let errorMsg = "Anthropic API request failed.";
          try {
            const parsed = JSON.parse(detail);
            if (parsed?.error?.message) {
              errorMsg = parsed.error.message;
            }
          } catch (_) { }

          return res.status(502).json({
            error: errorMsg,
          });
        }

        const data = await response.json();
        content = data.content?.[0]?.text || "";
      }

      return res.json({ content });

    } catch (error) {
      console.error("Chat error:", error);
      return res.status(500).json({
        error: "Unexpected server error.",
      });
    }
  }
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error.",
  });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  const gKey = (process.env.GROQ_API_KEY || process.env.GROQ_KEY || "").trim();
  const status = gKey
    ? "LOADED (configured securely)"
    : "NOT LOADED / EMPTY in backend/.env";
  console.log(`[Groq Status] GROQ_API_KEY is: ${status}`);
});