import React from "react";
import "./SuggestionCard.css";

function SuggestionCard({ icon, title, subtitle, onClick }) {
  return (
    <button className="suggestion-card" onClick={onClick}>
      <span className="suggestion-card__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="suggestion-card__text">
        <span className="suggestion-card__title">{title}</span>
        <span className="suggestion-card__subtitle">{subtitle}</span>
      </span>
    </button>
  );
}

export default SuggestionCard;
