"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { getMe, logoutUser } from "./auth-api";

import type { User } from "./auth.types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  loadUser: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  const [status, setStatus] = useState<AuthStatus>("loading");

  const loadUser = useCallback(async (): Promise<boolean> => {
    setStatus("loading");

    try {
      const response = await getMe();

      setUser(response.data);
      setStatus("authenticated");

      return true;
    } catch {
      setUser(null);
      setStatus("unauthenticated");

      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      loadUser,
      logout,
    }),
    [user, status, loadUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
