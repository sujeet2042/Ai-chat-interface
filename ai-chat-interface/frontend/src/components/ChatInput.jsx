import React, { useEffect, useRef, } from "react";
import "./ChatInput.css";

const MAX_CHARS = 4000;

function ChatInput({ value, onChange, onSend, isSending, onStop }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isSending) handleSend();
    }
  };

  const handleSend = () => {
    if (!value.trim() || isSending) return;
    onSend(value);
  };

  const charCount = value.length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <div className="chat-input">
      <div className={`chat-input__box ${isOverLimit ? "chat-input__box--over" : ""}`}>
        <button className="chat-input__icon-btn" aria-label="Attach a file" title="Attach a file">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path
              d="M17 8v8a5 5 0 0 1-10 0V6.5a3.5 3.5 0 0 1 7 0V15a2 2 0 1 1-4 0V8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          className="chat-input__textarea"
          placeholder="Message AI Assistant…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Message input"
        />

        <button className="chat-input__icon-btn" aria-label="Use microphone" title="Use microphone">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M5 11a7 7 0 0 0 14 0M12 18v3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {isSending ? (
          <button className="chat-input__send chat-input__send--stop" onClick={onStop} aria-label="Stop generating">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
              <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
            </svg>
          </button>
        ) : (
          <button
            className="chat-input__send"
            onClick={handleSend}
            disabled={!value.trim() || isOverLimit}
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      <div className="chat-input__footer">
        <span className="chat-input__hint">Enter to send · Shift + Enter for a new line</span>
        <span className={`chat-input__count ${isOverLimit ? "chat-input__count--over" : ""}`}>
          {charCount}/{MAX_CHARS}
        </span>
      </div>
    </div>
  );
}

export default ChatInput;
