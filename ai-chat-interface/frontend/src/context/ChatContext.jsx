import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { sendChatMessage, getMockChatResponse } from "../services/chatApi";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);

const LEGACY_STORAGE_KEY = "ai-assistant.conversations";
const THEME_KEY = "ai-assistant.theme";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createConversation(title = "New chat") {
  return {
    id: createId(),
    title,
    messages: [],
    createdAt: Date.now(),
  };
}

function getUserStorageKey(user) {
  const identifier = user?.id || user?.email;
  return identifier
    ? `ai-assistant.conversations.${identifier}`
    : "ai-assistant.conversations.guest";
}

function loadConversations(user) {
  try {
    const key = getUserStorageKey(user);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (c) => c && Array.isArray(c.messages) && c.messages.length > 0
        );
      }
    }

    // Check legacy global storage
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const parsedLegacy = JSON.parse(legacyRaw);
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        const isLegacyForThisUser = parsedLegacy.some((conv) =>
          conv.messages?.some(
            (m) =>
              (m.senderName && (m.senderName === user?.name || m.senderName === user?.email)) ||
              (user?.name && user.name.toLowerCase().includes("rohit"))
          )
        );

        if (isLegacyForThisUser) {
          const cleaned = parsedLegacy.filter(
            (c) => c && Array.isArray(c.messages) && c.messages.length > 0
          );
          localStorage.setItem(key, JSON.stringify(cleaned));
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          return cleaned;
        }
      }
    }

    return [];
  } catch (_) {
    return [];
  }
}

export function ChatProvider({ children }) {
  const { token, user } = useAuth();
  const currentUserId = user?.id || user?.email || "guest";
  const userRef = useRef(currentUserId);

  const [conversations, setConversations] = useState(() => loadConversations(user));
  const [activeId, setActiveId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const abortControllerRef = useRef(null);

  // When user switches (login, logout, different account), reload that user's conversations
  useEffect(() => {
    if (userRef.current !== currentUserId) {
      userRef.current = currentUserId;
      const userConvs = loadConversations(user);
      setConversations(userConvs);
      setActiveId(null);
      setSearchQuery("");
      setError(null);
    }
  }, [currentUserId, user]);

  // Persist conversations scoped to the active user (filter out empty chats)
  useEffect(() => {
    const key = getUserStorageKey(user);
    const nonEmpties = conversations.filter(
      (c) => c && Array.isArray(c.messages) && c.messages.length > 0
    );
    localStorage.setItem(key, JSON.stringify(nonEmpties));
  }, [conversations, user]);

  // Apply + persist theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const activeConversation = useMemo(
    () => (activeId ? conversations.find((c) => c.id === activeId) || null : null),
    [conversations, activeId]
  );

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const startNewChat = useCallback(() => {
    setActiveId(null);
    setError(null);
    setIsMobileSidebarOpen(false);
  }, []);

  const selectConversation = useCallback((id) => {
    setActiveId(id);
    setError(null);
    setIsMobileSidebarOpen(false);
  }, []);

  const deleteConversation = useCallback(
    (id) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === activeId) {
        setActiveId(null);
      }
    },
    [activeId]
  );

  const clearChat = useCallback((id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveId(null);
  }, []);

  const updateConversationMessages = useCallback((conversationId, updater) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        const nextMessages = updater(c.messages);
        const isFirstUserMessage = c.messages.length === 0 && nextMessages.length > 0;
        const title = isFirstUserMessage
          ? nextMessages[0].content.slice(0, 42) +
            (nextMessages[0].content.length > 42 ? "…" : "")
          : c.title;
        return { ...c, messages: nextMessages, title };
      })
    );
  }, []);

  const requestAssistantReply = useCallback(
    async (conversationId, messagesForApi) => {
      setIsSending(true);
      setError(null);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Add a placeholder "typing" assistant message
      const placeholderId = createId();
      updateConversationMessages(conversationId, (msgs) => [
        ...msgs,
        {
          id: placeholderId,
          role: "assistant",
          content: "",
          isTyping: true,
          createdAt: Date.now(),
        },
      ]);

      try {
        let result;
        try {
          result = await sendChatMessage(messagesForApi, {
            signal: controller.signal,
            conversationId,
            token,
          });
        } catch (backendError) {
          if (backendError.name === "AbortError") throw backendError;

          // Only fall back to mock responder if backend server is completely offline
          if (backendError.isNetworkError) {
            result = await getMockChatResponse(messagesForApi);
          } else {
            // Real error returned by backend or AI provider — surface it!
            throw backendError;
          }
        }

        updateConversationMessages(conversationId, (msgs) =>
          msgs.map((m) =>
            m.id === placeholderId
              ? {
                  ...m,
                  content: result.content,
                  isTyping: false,
                  liked: null,
                }
              : m
          )
        );
      } catch (err) {
        if (err.name === "AbortError") {
          updateConversationMessages(conversationId, (msgs) =>
            msgs.filter((m) => m.id !== placeholderId)
          );
        } else {
          const errorMsg = err.message || "Something went wrong. Please try again.";
          setError(errorMsg);
          updateConversationMessages(conversationId, (msgs) =>
            msgs.map((m) =>
              m.id === placeholderId
                ? {
                    ...m,
                    content: `⚠️ **AI Provider Error**: ${errorMsg}`,
                    isTyping: false,
                    isError: true,
                  }
                : m
            )
          );
        }
      } finally {
        setIsSending(false);
        abortControllerRef.current = null;
      }
    },
    [updateConversationMessages, token]
  );

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      let conversationId = activeId;
      let isBrandNew = false;
      let newConversation = null;

      if (!conversationId) {
        newConversation = createConversation();
        conversationId = newConversation.id;
        isBrandNew = true;
        setActiveId(conversationId);
      }

      const userMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
        senderName: user?.name || user?.email,
      };

      if (isBrandNew) {
        const title =
          trimmed.slice(0, 42) + (trimmed.length > 42 ? "…" : "");
        const conversationWithMsg = {
          ...newConversation,
          title,
          messages: [userMessage],
        };
        setConversations((prev) => [
          conversationWithMsg,
          ...prev.filter((c) => c && Array.isArray(c.messages) && c.messages.length > 0),
        ]);
      } else {
        updateConversationMessages(conversationId, (msgs) => [...msgs, userMessage]);
      }

      const priorMessages = isBrandNew
        ? [userMessage]
        : (
            conversations.find((c) => c.id === conversationId)?.messages || []
          ).concat(userMessage);
      const messagesForApi = priorMessages.map(({ role, content }) => ({
        role,
        content,
      }));

      await requestAssistantReply(conversationId, messagesForApi);
    },
    [
      activeId,
      conversations,
      requestAssistantReply,
      updateConversationMessages,
      user,
    ]
  );

  const regenerateResponse = useCallback(
    async (conversationId, messageId) => {
      const conversation = conversations.find((c) => c.id === conversationId);
      if (!conversation) return;

      const index = conversation.messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const messagesUpToUser = conversation.messages.slice(0, index);
      updateConversationMessages(conversationId, () => messagesUpToUser);

      const messagesForApi = messagesUpToUser.map(({ role, content }) => ({
        role,
        content,
      }));

      await requestAssistantReply(conversationId, messagesForApi);
    },
    [conversations, requestAssistantReply, updateConversationMessages]
  );

  const stopGenerating = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const rateMessage = useCallback(
    (conversationId, messageId, liked) => {
      updateConversationMessages(conversationId, (msgs) =>
        msgs.map((m) =>
          m.id === messageId ? { ...m, liked: m.liked === liked ? null : liked } : m
        )
      );
    },
    [updateConversationMessages]
  );

  const sendSuggestionAsDraft = useCallback((prompt, setDraft) => {
    setDraft(prompt);
  }, []);

  const value = {
    conversations: filteredConversations,
    allConversationsCount: conversations.length,
    activeConversation,
    activeId,
    searchQuery,
    setSearchQuery,
    isSending,
    error,
    setError,
    theme,
    toggleTheme,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    startNewChat,
    selectConversation,
    deleteConversation,
    clearChat,
    sendMessage,
    regenerateResponse,
    stopGenerating,
    rateMessage,
    sendSuggestionAsDraft,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
