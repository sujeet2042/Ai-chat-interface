import React, { useState } from "react";
import "./MessageActions.css";

function MessageActions({ content, liked, onLike, onDislike, onRegenerate, showRegenerate }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      /* clipboard unavailable — silently ignore */
    }
  };

  return (
    <div className="message-actions">
      <button
        className="message-actions__btn"
        onClick={handleCopy}
        aria-label="Copy response"
        title={copied ? "Copied!" : "Copy"}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
            <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
            <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5 15V6a2 2 0 0 1 2-2h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {showRegenerate && (
        <button
          className="message-actions__btn"
          onClick={onRegenerate}
          aria-label="Regenerate response"
          title="Regenerate"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
            <path
              d="M20 11a8 8 0 1 0-2.34 5.66M20 11V5m0 6h-6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      <button
        className={`message-actions__btn ${liked === true ? "message-actions__btn--active-like" : ""}`}
        onClick={onLike}
        aria-label="Like response"
        aria-pressed={liked === true}
        title="Good response"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
          <path
            d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Zm0 0 4.5-8a2 2 0 0 1 2 2v4h4.2a2 2 0 0 1 1.97 2.3l-1 6A2 2 0 0 1 16.72 20H7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        className={`message-actions__btn ${liked === false ? "message-actions__btn--active-dislike" : ""}`}
        onClick={onDislike}
        aria-label="Dislike response"
        aria-pressed={liked === false}
        title="Poor response"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
          <path
            d="M17 13V4h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-3Zm0 0-4.5 8a2 2 0 0 1-2-2v-4H6.3a2 2 0 0 1-1.97-2.3l1-6A2 2 0 0 1 7.28 5H17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

export default MessageActions;
