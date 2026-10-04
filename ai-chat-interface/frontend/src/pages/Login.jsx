import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function getEmailSuggestion(email) {
  if (!email || !email.includes("@")) return null;
  const typos = {
    "gamil.com": "gmail.com",
    "gmal.com": "gmail.com",
    "gmial.com": "gmail.com",
    "gmaill.com": "gmail.com",
    "gmai.com": "gmail.com",
    "yaho.com": "yahoo.com",
    "hotmial.com": "hotmail.com",
    "outlok.com": "outlook.com",
  };
  const parts = email.split("@");
  if (parts.length === 2 && typos[parts[1].toLowerCase().trim()]) {
    return `${parts[0]}@${typos[parts[1].toLowerCase().trim()]}`;
  }
  return null;
}

function Login() {
  const { login, signup, isLoading, error, setError } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const emailSuggestion = getEmailSuggestion(form.email);

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const switchMode = () => {
    setError(null);
    setMode((m) => (m === "login" ? "signup" : "login"));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === "login") {
      await login({ email: form.email, password: form.password });
    } else {
      await signup(form);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-card__brand">
          <span className="auth-card__logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <path
                d="M12 2.5 14.2 9.3 21 12l-6.8 2.7L12 21.5 9.8 14.7 3 12l6.8-2.7L12 2.5Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="auth-card__brand-name">AI Assistant</span>
        </div>

        <h1 className="auth-card__heading">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="auth-card__subheading">
          {mode === "login"
            ? "Sign in to pick up your conversations."
            : "Sign up to start chatting with AI Assistant."}
        </p>

        {error && (
          <div className="auth-card__error" role="alert">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {mode === "signup" && (
            <label className="auth-form__field">
              <span>Name</span>
              <input
                type="text"
                required
                autoComplete="name"
                value={form.name}
                onChange={updateField("name")}
                placeholder="Alex Jordan"
              />
            </label>
          )}

          <label className="auth-form__field">
            <span>Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={updateField("email")}
              placeholder="you@example.com"
            />
            {emailSuggestion && (
              <span className="auth-form__hint">
                Did you mean{" "}
                <button
                  type="button"
                  className="auth-form__hint-btn"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, email: emailSuggestion }))
                  }
                >
                  {emailSuggestion}
                </button>
                ?
              </span>
            )}
          </label>

          <label className="auth-form__field">
            <span>Password</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={form.password}
              onChange={updateField("password")}
              placeholder="••••••••"
            />
          </label>

          <button className="auth-form__submit" type="submit" disabled={isLoading}>
            {isLoading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="auth-card__switch">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button type="button" onClick={switchMode}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
