"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
// Non-sensitive profile cache only — the JWT now lives in an httpOnly cookie
// set by the server. This avoids reading/parsing the token from JS, which
// closes the XSS exfiltration vector.
const PROFILE_KEY = "mal_profile";
// Legacy key (held the JWT in localStorage). We purge it on load.
const LEGACY_KEY = "mal_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Drop any legacy token-bearing entry from before the cookie migration.
    if (localStorage.getItem(LEGACY_KEY)) {
      localStorage.removeItem(LEGACY_KEY);
    }
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      try {
        setUser(JSON.parse(saved) as AuthUser);
      } catch {
        localStorage.removeItem(PROFILE_KEY);
      }
    }
    setLoading(false);

    const handleExpired = () => {
      setUser(null);
      localStorage.removeItem(PROFILE_KEY);
    };
    window.addEventListener("mal_auth_expired", handleExpired);
    return () => window.removeEventListener("mal_auth_expired", handleExpired);
  }, []);

  const login = useCallback(async (credential: string) => {
    const res = await fetch(`${API_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // server sets the auth cookie
      body: JSON.stringify({ credential }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Login failed" })) as { error?: string };
      throw new Error(err.error || "Login failed");
    }

    const data = await res.json() as { user: AuthUser };
    setUser(data.user);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(data.user));
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem(PROFILE_KEY);
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // best-effort
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
