import React from "react";
import { useChat } from "../context/ChatContext";
import "./ChatHeader.css";

function ChatHeader() {
  const { activeConversation, isSending, clearChat, theme, toggleTheme, setIsMobileSidebarOpen } =
    useChat();

  return (
    <header className="chat-header">
      <button
        className="chat-header__menu-btn"
        onClick={() => setIsMobileSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      <div className="chat-header__title">
        <span className="chat-header__avatar">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <path d="M12 2.5 14.2 9.3 21 12l-6.8 2.7L12 21.5 9.8 14.7 3 12l6.8-2.7L12 2.5Z" fill="currentColor" />
          </svg>
        </span>
        <div>
          <p className="chat-header__name">AI Assistant</p>
          <p className="chat-header__status">
            <span className={`chat-header__status-dot ${isSending ? "chat-header__status-dot--busy" : ""}`} />
            {isSending ? "Responding…" : "Online"}
          </p>
        </div>
      </div>

      <div className="chat-header__actions">
        {activeConversation && activeConversation.messages.length > 0 && (
          <button
            className="chat-header__icon-btn"
            onClick={() => clearChat(activeConversation.id)}
            title="Clear chat"
            aria-label="Clear chat"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none">
              <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0 1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <button
          className="chat-header__icon-btn"
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none">
              <path d="M21 12.6A9 9 0 1 1 11.4 3a7 7 0 0 0 9.6 9.6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none">
              <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}

export default ChatHeader;
