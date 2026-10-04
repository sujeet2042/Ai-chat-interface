import React from "react";
import "./TypingIndicator.css";

function TypingIndicator() {
  return (
    <div className="typing-indicator" role="status" aria-label="AI is typing">
      <span className="typing-indicator__dot" />
      <span className="typing-indicator__dot" />
      <span className="typing-indicator__dot" />
    </div>
  );
}

export default TypingIndicator;
