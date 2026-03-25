"use client";

import type { ThemePreference, UserPreferences } from "@/lib/types";
import { defaultUserPreferences } from "@/lib/types";

export const THEME_STORAGE_KEY = "psychboard-theme";

export function normalizePreferences(value: unknown): UserPreferences {
  const source = typeof value === "object" && value !== null ? (value as Partial<UserPreferences>) : {};

  return {
    email_notifications: typeof source.email_notifications === "boolean" ? source.email_notifications : defaultUserPreferences.email_notifications,
    push_notifications: typeof source.push_notifications === "boolean" ? source.push_notifications : defaultUserPreferences.push_notifications,
    email_reminders: typeof source.email_reminders === "boolean" ? source.email_reminders : defaultUserPreferences.email_reminders,
    study_reminders: typeof source.study_reminders === "boolean" ? source.study_reminders : defaultUserPreferences.study_reminders,
    theme: source.theme === "light" || source.theme === "dark" || source.theme === "system" ? source.theme : defaultUserPreferences.theme
  };
}

export function applyTheme(theme: ThemePreference) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const resolvedTheme = theme === "system"
    ? (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.theme = resolvedTheme;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore local storage failures.
  }
}
