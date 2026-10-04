import React from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/avatar";
import "./Sidebar.css";

function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function Sidebar({ onOpenSettings }) {
  const {
    conversations,
    activeId,
    searchQuery,
    setSearchQuery,
    startNewChat,
    selectConversation,
    deleteConversation,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useChat();
  const { user, logout } = useAuth();

  return (
    <>
      {isMobileSidebarOpen && (
        <div
          className="sidebar-scrim"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${isMobileSidebarOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__brand">
          <span className="sidebar__logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <path
                d="M12 2.5 14.2 9.3 21 12l-6.8 2.7L12 21.5 9.8 14.7 3 12l6.8-2.7L12 2.5Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="sidebar__brand-name">AI Assistant</span>
          <button
            className="sidebar__close-btn"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <button
          className={`sidebar__new-chat ${!activeId ? "sidebar__new-chat--active" : ""}`}
          onClick={startNewChat}
        >
          <span className="sidebar__new-chat-icon">+</span>
          New chat
        </button>

        <div className="sidebar__search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search conversations"
          />
        </div>

        <nav className="sidebar__history" aria-label="Recent conversations">
          <p className="sidebar__section-label">Recent</p>
          {conversations.length === 0 && (
            <p className="sidebar__empty">
              {searchQuery ? "No conversations match your search." : "No conversations yet."}
            </p>
          )}
          <ul>
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  className={`sidebar__history-item ${
                    conversation.id === activeId ? "sidebar__history-item--active" : ""
                  }`}
                  onClick={() => selectConversation(conversation.id)}
                >
                  <span className="sidebar__history-title">
                    {conversation.title || "New chat"}
                  </span>
                  <span className="sidebar__history-time">
                    {formatRelativeTime(conversation.createdAt)}
                  </span>
                </button>
                <button
                  className="sidebar__history-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                  aria-label={`Delete conversation: ${conversation.title}`}
                  title="Delete conversation"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                    <path
                      d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0 1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__profile">
            <span className="sidebar__avatar">{getInitials(user?.name || user?.email)}</span>
            <div className="sidebar__profile-info">
              <span className="sidebar__profile-name">{user?.name || user?.email || "Guest"}</span>
              <span className="sidebar__profile-plan">Free plan</span>
            </div>
          </div>
          <button
            className="sidebar__settings-btn"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title="Settings"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M19.4 13a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H4a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H10a1.65 1.65 0 0 0 1-1.51V4a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V10a1.65 1.65 0 0 0 1.51 1H20a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
          </button>
          <button
            className="sidebar__settings-btn"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M15 17v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1M10 12h11m0 0-3.5-3.5M21 12l-3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
