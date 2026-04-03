import type { ImportType } from "@/lib/types";

const TITLE_PREFIX_BY_TYPE: Record<ImportType, string> = {
  exam: "[EXAM]",
  quiz: "[QUIZ]",
  flashcard: "[FLASHCARD]"
};

const LABEL_PATTERN = /(chapter|exam)\s+(\d+(?:\s*[-–]\s*\d+)?|[a-z]+)/i;
const LABEL_PREFIX_PATTERN = /^(chapter|exam)\s+(\d+(?:\s*[-–]\s*\d+)?|[a-z]+)(?:\s*:\s*|\s+)/i;

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

  const match = value.match(LABEL_PATTERN);
  if (!match) {
    return null;
  }

  const labelType = match[1].toLowerCase() === "exam" ? "Exam" : "Chapter";
  const normalized = match[2].replace(/\s*[-–]\s*/g, "-");
  return `${labelType} ${normalized}`;
}

export function stripChapterFromTopic(topic: string | null | undefined) {
  if (!topic) {
    return "General";
  }

  const trimmed = topic.trim();
  const withoutChapterPrefix = trimmed.replace(LABEL_PREFIX_PATTERN, "").trim();

  if (!withoutChapterPrefix) {
    return "General";
  }

  const duplicateMatch = withoutChapterPrefix.match(/^(.+?)\s*:\s*\1$/i);
  const collapsed = (duplicateMatch ? duplicateMatch[1] : withoutChapterPrefix).trim();
  return collapsed || "General";
}

function getChapterOrderValue(label: string | null | undefined) {
  if (!label) {
    return Number.POSITIVE_INFINITY;
  }

  const match = label.match(LABEL_PATTERN);
  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const labelTypeWeight = match[1].toLowerCase() === "exam" ? 10000 : 0;
  const rawValue = match[2].toLowerCase();
  const numericValue = Number.parseInt(rawValue, 10);
  if (!Number.isNaN(numericValue)) {
    return labelTypeWeight + numericValue;
  }

  const alphabetValue = rawValue.charCodeAt(0) - 96;
  return alphabetValue > 0 ? labelTypeWeight + alphabetValue : Number.POSITIVE_INFINITY;
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
