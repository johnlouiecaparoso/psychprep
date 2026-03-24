import { DIFFICULTIES, ROLES } from "@/lib/constants";

export type Role = (typeof ROLES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];

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

export type ImportErrorRecord = {
  rowNumber: number;
  message: string;
  rawData: Record<string, unknown>;
};

export type ParsedImportRow = {
  question_text: string;
  explanation: string;
  difficulty: Difficulty;
  subject: string;
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
