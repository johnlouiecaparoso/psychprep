import {
  DEFAULT_USER_PREFERENCES,
  DIFFICULTIES,
  IMPORT_TYPES,
  ROLES,
  STUDY_TECHNIQUES,
  THEME_OPTIONS
} from "@/lib/constants";

export type Role = (typeof ROLES)[number];
export type LegacyRole = Role | "instructor";
export type Difficulty = (typeof DIFFICULTIES)[number];
export type ThemePreference = (typeof THEME_OPTIONS)[number];
export type StudyTechnique = (typeof STUDY_TECHNIQUES)[number];
export type ImportType = (typeof IMPORT_TYPES)[number];

export type UserPreferences = {
  email_notifications: boolean;
  push_notifications: boolean;
  email_reminders: boolean;
  study_reminders: boolean;
  theme: ThemePreference;
  study_technique: StudyTechnique;
};

export const defaultUserPreferences: UserPreferences = {
  ...DEFAULT_USER_PREFERENCES
};

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
};

export type ImportedQuestionRow = {
  Question: string;
  "Choice 1": string;
  "Choice 2": string;
  "Choice 3": string;
  "Choice 4": string;
  "Correct Answer (1-4)": string | number;
  Explanation: string;
  Difficulty: Difficulty;
  Subject: string;
  Topic: string;
};

export type ImportedFlashcardRow = {
  Front: string;
  Back: string;
  Explanation: string;
  Difficulty: Difficulty;
  Subject: string;
  Chapter: string;
  Topic: string;
};

export type ImportErrorRecord = {
  rowNumber: number;
  message: string;
  rawData: Record<string, unknown>;
};

export type ParsedImportRow = {
  import_type?: ImportType;
  question_text: string;
  explanation: string;
  difficulty: Difficulty;
  subject: string;
  chapter?: string;
  topic: string;
  choices: {
    choice_key: "A" | "B" | "C" | "D";
    choice_text: string;
    is_correct: boolean;
  }[];
};

export type DashboardStat = {
  label: string;
  value: string;
  helper: string;
};

export type ReviewQuestion = ParsedImportRow & {
  id: string;
  mock_exam_id: string;
};

export type MockExamSummary = {
  id: string;
  title: string;
  subject: string;
  chapter: string | null;
  topics: string[];
  questionCount: number;
  topicCount: number;
};

export type AttemptReviewItem = {
  questionId: string;
  questionText: string;
  explanation: string;
  topic: string;
  subject: string;
  selectedChoice: "A" | "B" | "C" | "D" | null;
  correctChoice: "A" | "B" | "C" | "D";
  isCorrect: boolean;
  choices: {
    choice_key: "A" | "B" | "C" | "D";
    choice_text: string;
    is_correct: boolean;
  }[];
};

export type AttemptResult = {
  id: string;
  score: number;
  totalItems: number;
  correctCount: number;
  weakTopics: string[];
  items: AttemptReviewItem[];
};

export type ReviewMaterial = {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  fileName: string;
  createdAt: string;
};
