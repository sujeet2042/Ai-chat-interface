import React, { useMemo, useState } from "react";
import MessageActions from "./MessageActions";
import TypingIndicator from "./TypingIndicator";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/avatar";
import "./Message.css";

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Minimal, dependency-free markdown-style renderer.
 * Supports: fenced code blocks, inline code, bold, italic,
 * unordered/ordered lists, and paragraphs.
 */
function parseInline(text, keyPrefix) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code className="message__inline-code" key={key}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      /* ignore */
    }
  };

  return (
    <div className="code-block">
      <div className="code-block__header">
        <span className="code-block__lang">{language || "text"}</span>
        <button className="code-block__copy" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="code-block__pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MarkdownContent({ text }) {
  const blocks = useMemo(() => {
    const segments = [];
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
      }
      segments.push({ type: "code", language: match[1], content: match[2].replace(/\n$/, "") });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      segments.push({ type: "text", content: text.slice(lastIndex) });
    }
    return segments;
  }, [text]);

  return (
    <div className="message__markdown">
      {blocks.map((block, i) => {
        if (block.type === "code") {
          return <CodeBlock key={i} language={block.language} code={block.content} />;
        }
        const lines = block.content.split("\n").filter((l, idx, arr) => !(l === "" && (idx === 0 || idx === arr.length - 1)));
        return (
          <React.Fragment key={i}>
            {lines.map((line, j) => {
              if (/^\s*[-*]\s+/.test(line)) {
                return (
                  <li className="message__list-item" key={j}>
                    {parseInline(line.replace(/^\s*[-*]\s+/, ""), `${i}-${j}`)}
                  </li>
                );
              }
              if (/^\s*\d+\.\s+/.test(line)) {
                return (
                  <li className="message__list-item message__list-item--ordered" key={j}>
                    {parseInline(line.replace(/^\s*\d+\.\s+/, ""), `${i}-${j}`)}
                  </li>
                );
              }
              if (line.trim() === "") return <br key={j} />;
              return (
                <p className="message__paragraph" key={j}>
                  {parseInline(line, `${i}-${j}`)}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Message({ message, conversationId, isLastAssistantMessage }) {
  const { rateMessage, regenerateResponse } = useChat();
  const { user } = useAuth();
  const isUser = message.role === "user";
  const userInitials = getInitials(message.senderName || user?.name || user?.email || "User");

  return (
    <div className={`message ${isUser ? "message--user" : "message--assistant"}`}>
      {!isUser && (
        <span className="message__avatar message__avatar--ai" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
            <path d="M12 2.5 14.2 9.3 21 12l-6.8 2.7L12 21.5 9.8 14.7 3 12l6.8-2.7L12 2.5Z" fill="currentColor" />
          </svg>
        </span>
      )}

      <div className="message__body">
        <div className={`message__bubble ${message.isError ? "message__bubble--error" : ""}`}>
          {message.isTyping ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="message__paragraph">{message.content}</p>
          ) : (
            <MarkdownContent text={message.content} />
          )}
        </div>

        {!message.isTyping && (
          <div className="message__meta">
            <span className="message__time">{formatTime(message.createdAt)}</span>
          </div>
        )}

        {!isUser && !message.isTyping && (
          <MessageActions
            content={message.content}
            liked={message.liked}
            onLike={() => rateMessage(conversationId, message.id, true)}
            onDislike={() => rateMessage(conversationId, message.id, false)}
            onRegenerate={() => regenerateResponse(conversationId, message.id)}
            showRegenerate={isLastAssistantMessage}
          />
        )}
      </div>

      {isUser && (
        <span className="message__avatar message__avatar--user" aria-hidden="true">
          {userInitials}
        </span>
      )}
    </div>
  );
}

export default Message;
