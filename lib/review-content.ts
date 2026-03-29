import type { ImportType } from "@/lib/types";

const TITLE_PREFIX_BY_TYPE: Record<ImportType, string> = {
  exam: "[EXAM]",
  quiz: "[QUIZ]",
  flashcard: "[FLASHCARD]"
};

export function getImportPrefix(importType: ImportType) {
  return TITLE_PREFIX_BY_TYPE[importType];
}

export function stripImportPrefix(title: string) {
  return title.replace(/^\[(EXAM|QUIZ|FLASHCARD)\]\s*/i, "").trim();
}

export function detectImportTypeFromTitle(title: string): ImportType | null {
  if (/^\[EXAM\]/i.test(title)) {
    return "exam";
  }

  if (/^\[QUIZ\]/i.test(title)) {
    return "quiz";
  }

  if (/^\[FLASHCARD\]/i.test(title)) {
    return "flashcard";
  }

  return null;
}

export function inferChapterLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(/chapter\s+([a-z0-9]+)/i);
  return match ? `Chapter ${match[1]}` : null;
}

export function stripChapterFromTopic(topic: string | null | undefined) {
  if (!topic) {
    return "General";
  }

  return topic.replace(/^chapter\s+[a-z0-9]+\s*:\s*/i, "").trim() || topic.trim();
}
