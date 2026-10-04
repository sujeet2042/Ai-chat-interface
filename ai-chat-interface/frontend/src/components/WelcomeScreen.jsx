import React from "react";
import SuggestionCard from "./SuggestionCard";
import "./WelcomeScreen.css";

const SUGGESTIONS = [
  {
    icon: "💡",
    title: "Explain something",
    subtitle: "Break down a tricky concept",
    prompt: "Explain how neural networks learn, in simple terms.",
  },
  {
    icon: "💻",
    title: "Write code",
    subtitle: "Generate or debug a snippet",
    prompt: "Write a JavaScript function that debounces an input handler.",
  },
  {
    icon: "✍️",
    title: "Write content",
    subtitle: "Draft copy, emails, or posts",
    prompt: "Write a short, friendly launch announcement for a new app feature.",
  },
  {
    icon: "🚀",
    title: "Build a project",
    subtitle: "Plan or scaffold something new",
    prompt: "Help me plan the architecture for a personal budgeting app.",
  },
];

function WelcomeScreen({ onSelectSuggestion }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-screen__badge" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
          <path d="M12 2.5 14.2 9.3 21 12l-6.8 2.7L12 21.5 9.8 14.7 3 12l6.8-2.7L12 2.5Z" fill="currentColor" />
        </svg>
      </div>
      <h1 className="welcome-screen__heading">How can I help you today?</h1>
      <p className="welcome-screen__subheading">
        Ask a question, paste some code, or pick a starting point below.
      </p>
      <div className="welcome-screen__grid">
        {SUGGESTIONS.map((s) => (
          <SuggestionCard
            key={s.title}
            icon={s.icon}
            title={s.title}
            subtitle={s.subtitle}
            onClick={() => onSelectSuggestion(s.prompt)}
          />
        ))}
      </div>
    </div>
  );
}

export default WelcomeScreen;
