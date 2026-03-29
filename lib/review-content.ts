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

export function stripUploadSuffix(title: string) {
  return title.replace(/\s*\[[a-f0-9]{6,}\]\s*$/i, "").trim();
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

function getChapterOrderValue(label: string | null | undefined) {
  if (!label) {
    return Number.POSITIVE_INFINITY;
  }

  const match = label.match(/chapter\s+(\d+|[a-z]+)/i);
  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const rawValue = match[1].toLowerCase();
  const numericValue = Number.parseInt(rawValue, 10);
  if (!Number.isNaN(numericValue)) {
    return numericValue;
  }

  const alphabetValue = rawValue.charCodeAt(0) - 96;
  return alphabetValue > 0 ? alphabetValue : Number.POSITIVE_INFINITY;
}

export function compareChapterLabels(left: string | null | undefined, right: string | null | undefined) {
  const orderDifference = getChapterOrderValue(left) - getChapterOrderValue(right);
  if (orderDifference !== 0) {
    return orderDifference;
  }

  return (left ?? "").localeCompare(right ?? "", undefined, {
    sensitivity: "base",
    numeric: true
  });
}
