AI Assistant — Chat Interface
A modern, responsive AI chatbot UI built with React, plain CSS, and Hooks — no Tailwind, no Bootstrap, no UI framework.

Structure
ai-chat-interface/
├── frontend/                  React app (this is all you deploy to the browser)
│   └── src/
│       ├── components/        Sidebar, ChatHeader, WelcomeScreen, ChatContainer,
│       │                      Message, MessageActions, ChatInput, TypingIndicator,
│       │                      SuggestionCard — each with its own .css
│       ├── pages/              Chat.jsx (main app) and Login.jsx (sign in / sign up)
│       ├── context/            ChatContext.jsx and AuthContext.jsx — all app state,
│       │                      via useState/useCallback/useContext
│       ├── services/           chatApi.js and authApi.js — the ONLY files that call
│       │                      the backend
│       ├── App.js / App.css / index.js / index.css
│       └── public/index.html
│
└── backend-example/           Reference Node/Express backend (NOT part of the
                                 React bundle). Holds the real AI provider key and
                                 the demo user store.
Authentication
AuthContext gates the whole app: App.js shows Login until isAuthenticated is true, then mounts ChatProvider + Chat. Sign-up, sign-in, and sign-out all go through services/authApi.js, which calls:

POST /api/auth/signup → { user, token }
POST /api/auth/login → { user, token }
POST /api/auth/logout
GET /api/auth/me
The returned token is stored in localStorage and sent as Authorization: Bearer <token> on every /api/chat request. Signing out clears it and returns you to the Login screen.

Just like chatApi.js, authApi.js has a demo fallback (mockSignup / mockLogin) that keeps accounts in localStorage on your own device, so sign up / sign in / sign out are fully testable with zero backend running. Once a real backend is live, the fallback is bypassed automatically — no frontend changes needed.

The included backend-example/server.js implements /api/auth/* with an in-memory user store and a hashed (sha256) password — good enough to see the whole flow work, but replace it with a real database, bcrypt/argon2 password hashing, and signed JWTs (or real sessions) before shipping this anywhere real.

Running the frontend
cd frontend
npm install
cp .env.example .env      # points REACT_APP_API_BASE_URL at your backend
npm start
The app works even without a backend running: chatApi.js falls back to a local mock responder so the UI is fully interactive out of the box. Once you point REACT_APP_API_BASE_URL at a real backend exposing POST /api/chat, real responses take over automatically — no frontend code changes needed.

Running the example backend
cd backend-example
npm install
cp .env.example .env      # add your real AI_API_KEY here
npm start
Data flow
React Frontend → POST /api/chat → Backend API → AI Provider
AI Provider → Backend API → React Frontend
No API keys or provider SDKs ever live in frontend/src.

Features
Sign up, sign in, and sign out, with a protected chat screen behind auth
Sidebar: new chat, search, conversation history with delete, profile, settings
Welcome screen with four clickable suggestion cards
Right-aligned user / left-aligned AI messages with avatars & timestamps
Lightweight built-in markdown renderer: paragraphs, bold/italic, inline code, lists, and fenced code blocks with a copy button
Regenerate response, like/dislike, copy response
Typing indicator, auto-scroll, stop-generating
Auto-expanding textarea, Enter to send / Shift+Enter for newline, char counter
Light/dark theme toggle (persisted), fully responsive with a mobile drawer sidebar
Conversations & theme persisted to localStorage
