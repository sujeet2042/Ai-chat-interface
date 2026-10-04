import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import WelcomeScreen from "../components/WelcomeScreen";
import ChatContainer from "../components/ChatContainer";
import ChatInput from "../components/ChatInput";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import "./Chat.css";

function Chat() {
  const { activeConversation, isSending, error, setError, sendMessage, stopGenerating } = useChat();
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const messages = activeConversation?.messages ?? [];
  const hasMessages = messages.length > 0;

  const handleSend = async (text) => {
    setDraft("");
    await sendMessage(text);
  };

  return (
    <div className="app-shell">
      <Sidebar onOpenSettings={() => setShowSettings(true)} />

      <main className="chat-page">
        <ChatHeader />

        {error && (
          <div className="chat-page__error" role="alert">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss error">
              ✕
            </button>
          </div>
        )}

        {hasMessages ? (
          <ChatContainer messages={messages} conversationId={activeConversation.id} />
        ) : (
          <WelcomeScreen onSelectSuggestion={setDraft} />
        )}

        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          isSending={isSending}
          onStop={stopGenerating}
        />
      </main>

      {showSettings && (
        <div className="settings-modal__scrim" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal__header">
              <h2>Settings</h2>
              <button onClick={() => setShowSettings(false)} aria-label="Close settings">
                ✕
              </button>
            </div>
            {user?.name && (
              <div className="settings-modal__row">
                <span>Name</span>
                <span className="settings-modal__value">{user.name}</span>
              </div>
            )}
            <div className="settings-modal__row">
              <span>Account</span>
              <span className="settings-modal__value">{user?.email || "Guest"}</span>
            </div>
            <div className="settings-modal__row">
              <span>Plan</span>
              <span className="settings-modal__value">Free</span>
            </div>
            <p className="settings-modal__note">
              Appearance is controlled from the sun/moon icon in the top bar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
