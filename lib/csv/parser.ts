import Papa from "papaparse";
import * as XLSX from "xlsx";
import { CHOICE_KEYS, EXAM_IMPORT_HEADERS, FLASHCARD_IMPORT_HEADERS } from "@/lib/constants";
import type {
  ImportType,
  ImportErrorRecord,
  ImportedFlashcardRow,
  ImportedQuestionRow,
  ParsedImportRow
} from "@/lib/types";
import { csvRowSchema, flashcardCsvRowSchema } from "@/lib/validations/import";

function mapChoiceIndexToKey(value: number) {
  return CHOICE_KEYS[value - 1];
}

export async function parseExamFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    return parsed.data;
  }

  if (extension === "xlsx" || extension === "xls") {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, {
      defval: ""
    });
  }

  throw new Error("Unsupported file type. Please upload CSV or Excel.");
}

function buildTopicName(chapter: string, topic: string) {
  const normalizedChapter = chapter.trim();
  const normalizedTopic = topic.trim();
  return normalizedTopic.toLowerCase().startsWith(normalizedChapter.toLowerCase())
    ? normalizedTopic
    : `${normalizedChapter}: ${normalizedTopic}`;
}

function buildFlashcardChoices(answer: string) {
  return [
    { choice_key: "A" as const, choice_text: answer, is_correct: true },
    { choice_key: "B" as const, choice_text: "Review the concept details.", is_correct: false },
    { choice_key: "C" as const, choice_text: "Check the explanation for the full answer.", is_correct: false },
    { choice_key: "D" as const, choice_text: "Revisit this flashcard again later.", is_correct: false }
  ];
}

export function validateImportRows(rows: Record<string, unknown>[], importType: ImportType = "exam") {
  const validRows: ParsedImportRow[] = [];
  const errors: ImportErrorRecord[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const normalizedRow = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.trim(), value])
    );

    const parsed = importType === "flashcard"
      ? flashcardCsvRowSchema.safeParse(normalizedRow)
      : csvRowSchema.safeParse(normalizedRow);

    if (!parsed.success) {
      errors.push({
        rowNumber,
        message: parsed.error.issues.map((issue) => issue.message).join(", "),
        rawData: normalizedRow
      });
      return;
    }

    if (importType === "flashcard") {
      const data = parsed.data as ImportedFlashcardRow;

      validRows.push({
        import_type: importType,
        question_text: data.Front,
        explanation: data.Explanation,
        difficulty: data.Difficulty,
        subject: data.Subject,
        chapter: data.Chapter,
        topic: buildTopicName(data.Chapter, data.Topic),
        choices: buildFlashcardChoices(data.Back)
      });
      return;
    }

    const data = parsed.data as ImportedQuestionRow & { Chapter: string };
    const correctKey = mapChoiceIndexToKey(Number(data["Correct Answer (1-4)"]));

    validRows.push({
      import_type: importType,
      question_text: data.Question,
      explanation: data.Explanation,
      difficulty: data.Difficulty,
      subject: data.Subject,
      chapter: data.Chapter,
      topic: buildTopicName(data.Chapter, data.Topic),
      choices: [
        { choice_key: "A", choice_text: data["Choice 1"], is_correct: correctKey === "A" },
        { choice_key: "B", choice_text: data["Choice 2"], is_correct: correctKey === "B" },
        { choice_key: "C", choice_text: data["Choice 3"], is_correct: correctKey === "C" },
        { choice_key: "D", choice_text: data["Choice 4"], is_correct: correctKey === "D" }
      ]
    });
  });

  return {
    headers: importType === "flashcard" ? FLASHCARD_IMPORT_HEADERS : EXAM_IMPORT_HEADERS,
    validRows,
    errors,
    summary: {
      totalRows: rows.length,
      successRows: validRows.length,
      failedRows: errors.length
    }
  };
}
