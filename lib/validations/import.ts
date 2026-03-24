import { z } from "zod";

export const csvRowSchema = z.object({
  Question: z.string().trim().min(1, "Question is required."),
  "Choice 1": z.string().trim().min(1, "Choice 1 is required."),
  "Choice 2": z.string().trim().min(1, "Choice 2 is required."),
  "Choice 3": z.string().trim().min(1, "Choice 3 is required."),
  "Choice 4": z.string().trim().min(1, "Choice 4 is required."),
  "Correct Answer (1-4)": z.coerce.number().int().min(1).max(4),
  Explanation: z.string().trim().default(""),
  Difficulty: z.enum(["easy", "medium", "hard"]),
  Subject: z.string().trim().min(1, "Subject is required."),
  Topic: z.string().trim().min(1, "Topic is required.")
});
