export const APP_NAME = "PsychBoard";

export const ROLES = ["admin", "instructor", "student"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const CHOICE_KEYS = ["A", "B", "C", "D"] as const;
export const THEME_OPTIONS = ["light", "dark", "system"] as const;
export const STUDY_TECHNIQUES = ["active_recall", "pomodoro", "practice_test"] as const;

export const DEFAULT_USER_PREFERENCES = {
  email_notifications: true,
  push_notifications: false,
  email_reminders: true,
  study_reminders: true,
  theme: "system",
  study_technique: "practice_test"
} as const;

export const IMPORT_HEADERS = [
  "Question",
  "Choice 1",
  "Choice 2",
  "Choice 3",
  "Choice 4",
  "Correct Answer (1-4)",
  "Explanation",
  "Difficulty",
  "Subject",
  "Topic"
] as const;

export const ROLE_LABELS = {
  admin: "Admin",
  instructor: "Instructor",
  student: "Student"
} as const;
