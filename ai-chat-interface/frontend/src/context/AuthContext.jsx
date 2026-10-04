import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { loginRequest, signupRequest, logoutRequest, getMeRequest } from "../services/authApi";

const AuthContext = createContext(null);

const TOKEN_KEY = "ai-assistant.auth-token";
const USER_KEY = "ai-assistant.auth-user";

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function getInitialToken() {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    // Discard any leftover mock/demo tokens so user is prompted to log in cleanly
    if (!t || t.startsWith("demo-token-")) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return t;
  } catch (_) {
    return null;
  }
}

function getInitialUser() {
  const t = getInitialToken();
  if (!t) return null;
  return loadStoredUser();
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getInitialToken);
  const [user, setUser] = useState(getInitialUser);
  const [isInitializing, setIsInitializing] = useState(() => Boolean(getInitialToken()));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const persistSession = useCallback((nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextUser && nextToken) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      localStorage.setItem(TOKEN_KEY, nextToken);
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  // Validate existing stored token on initial app load with the backend
  useEffect(() => {
    const storedToken = getInitialToken();
    if (!storedToken) {
      setIsInitializing(false);
      return;
    }

    let isMounted = true;
    getMeRequest(storedToken)
      .then((verifiedUser) => {
        if (isMounted) {
          persistSession(verifiedUser, storedToken);
        }
      })
      .catch(() => {
        // Token is invalid or expired -> force login page
        if (isMounted) {
          persistSession(null, null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsInitializing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [persistSession]);

  const login = useCallback(
    async ({ email, password }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await loginRequest({ email, password });
        persistSession(result.user, result.token);
        return true;
      } catch (err) {
        setError(err.message || "Invalid email or password.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession]
  );

  const signup = useCallback(
    async ({ name, email, password }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await signupRequest({ name, email, password });
        persistSession(result.user, result.token);
        return true;
      } catch (err) {
        setError(err.message || "Unable to create your account.");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    if (token) {
      try {
        await logoutRequest(token);
      } catch (_) {
        /* best-effort — clear local session regardless */
      }
    }
    persistSession(null, null);
  }, [token, persistSession]);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isInitializing,
    isLoading,
    error,
    setError,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
