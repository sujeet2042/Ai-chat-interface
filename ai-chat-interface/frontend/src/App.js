import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import "./App.css";

function AuthenticatedApp() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <ChatProvider>
      <Chat />
    </ChatProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
