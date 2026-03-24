export const APP_NAME = "PsychBoard";

export const ROLES = ["admin", "instructor", "student"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const CHOICE_KEYS = ["A", "B", "C", "D"] as const;

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
