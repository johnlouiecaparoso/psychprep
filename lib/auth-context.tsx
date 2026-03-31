"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";
import { applyTheme, normalizePreferences, THEME_STORAGE_KEY } from "./preferences";
import type { ThemePreference, UserPreferences } from "./types";
import { defaultUserPreferences } from "./types";

interface AuthContextType {
  user: User | null;
  userId: string | null;
  userRole: string | null;
  preferences: UserPreferences;
  loading: boolean;
  updatePreferences: (preferences: UserPreferences) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultUserPreferences);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);

  const readStoredTheme = (): ThemePreference => {
    if (typeof window === "undefined") {
      return defaultUserPreferences.theme;
    }

    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
        return storedTheme;
      }
    } catch {
      // Ignore storage failures.
    }

    return defaultUserPreferences.theme;
  };

  const syncPreferences = (sessionUser: User | null) => {
    const nextPreferences = sessionUser
      ? normalizePreferences(sessionUser.user_metadata?.preferences)
      : { ...defaultUserPreferences, theme: readStoredTheme() };

    setPreferences(nextPreferences);
    applyTheme(nextPreferences.theme);
  };

  const fetchUserRole = async (sessionUser: User) => {
    if (!supabase) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", sessionUser.id)
        .single();

      if (error) {
        const metadataRole = typeof sessionUser.user_metadata?.role === "string" ? sessionUser.user_metadata.role : null;
        setUserRole(metadataRole);
        return;
      }

      setUserRole(data.role ?? null);
    } catch (error) {
      console.error("Error fetching user role:", error);
      const metadataRole = typeof sessionUser.user_metadata?.role === "string" ? sessionUser.user_metadata.role : null;
      setUserRole(metadataRole);
    }
  };

  const updatePreferences = async (nextPreferences: UserPreferences) => {
    if (!user || !supabase) {
      setPreferences(nextPreferences);
      applyTheme(nextPreferences.theme);
      return;
    }

    const { data, error } = await supabase.auth.updateUser({
      data: {
        preferences: nextPreferences
      }
    });

    if (error) {
      throw error;
    }

    const nextUser = data.user ?? user;
    setUser(nextUser);
    setPreferences(normalizePreferences(nextUser.user_metadata?.preferences));
    applyTheme(nextPreferences.theme);
  };

  useEffect(() => {
    applyTheme(readStoredTheme());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setSupabase(createClient());
  }, []);

  useEffect(() => {
    const mediaQuery = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;

    if (!mediaQuery) {
      return;
    }

    const handleSystemThemeChange = () => {
      if (preferences.theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [preferences.theme]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    const applySessionState = async (sessionUser: User | null) => {
      setUser(sessionUser);
      syncPreferences(sessionUser);
      setLoading(true);

      if (sessionUser) {
        await fetchUserRole(sessionUser);
      } else {
        setUserRole(null);
      }

      if (active) {
        setLoading(false);
      }
    };

    const revalidateSessionState = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      syncPreferences(sessionUser);

      if (sessionUser) {
        void fetchUserRole(sessionUser);
      } else {
        setUserRole(null);
      }
    };

    const bootstrap = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      await applySessionState(session?.user ?? null);
    };

    void bootstrap();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;

      // Keep the callback synchronous to avoid blocking Supabase auth internals.
      setTimeout(() => {
        void applySessionState(sessionUser);
      }, 0);
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void revalidateSessionState();
      }
    };

    const handleWindowFocus = () => {
      void revalidateSessionState();
    };

    const handleOnline = () => {
      void revalidateSessionState();
    };

    const handlePageShow = () => {
      void revalidateSessionState();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("online", handleOnline);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [supabase]);

  const value = {
    user,
    userId: user?.id ?? null,
    userRole,
    preferences,
    loading,
    updatePreferences
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
