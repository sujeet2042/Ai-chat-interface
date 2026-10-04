import React, { useEffect, useRef } from "react";
import Message from "./Message";
import "./ChatContainer.css";

function ChatContainer({ messages, conversationId }) {
  const bottomRef = useRef(null);

  const messageCount = messages.length;
  const lastmessageCount = messages[messages.length - 1]?.content;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messageCount, lastmessageCount]);

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant" && !m.isTyping);

  return (
    <div className="chat-container">
      <div className="chat-container__scroll">
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            conversationId={conversationId}
            isLastAssistantMessage={lastAssistantMessage?.id === message.id}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default ChatContainer;
