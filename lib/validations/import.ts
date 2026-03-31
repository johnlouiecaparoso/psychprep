import { z } from "zod";

const difficultySchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim().toLowerCase();
}, z.enum(["easy", "medium", "hard"]));

export const csvRowSchema = z.object({
  Question: z.string().trim().min(1, "Question is required."),
  "Choice 1": z.string().trim().min(1, "Choice 1 is required."),
  "Choice 2": z.string().trim().min(1, "Choice 2 is required."),
  "Choice 3": z.string().trim().min(1, "Choice 3 is required."),
  "Choice 4": z.string().trim().min(1, "Choice 4 is required."),
  "Correct Answer (1-4)": z.coerce.number().int().min(1).max(4),
  Explanation: z.string().trim().default(""),
  Difficulty: difficultySchema,
  Subject: z.string().trim().min(1, "Subject is required."),
  Chapter: z.string().trim().min(1, "Chapter is required."),
  Topic: z.string().trim().min(1, "Topic is required.")
});

export const flashcardCsvRowSchema = z.object({
  Front: z.string().trim().min(1, "Front is required."),
  Back: z.string().trim().min(1, "Back is required."),
  Explanation: z.string().trim().default(""),
  Difficulty: difficultySchema,
  Subject: z.string().trim().min(1, "Subject is required."),
  Chapter: z.string().trim().min(1, "Chapter is required."),
  Topic: z.string().trim().min(1, "Topic is required.")
});
