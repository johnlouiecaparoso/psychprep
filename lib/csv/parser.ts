import Papa from "papaparse";
import * as XLSX from "xlsx";
import { CHOICE_KEYS, IMPORT_HEADERS } from "@/lib/constants";
import type {
  ImportErrorRecord,
  ImportedQuestionRow,
  ParsedImportRow
} from "@/lib/types";
import { csvRowSchema } from "@/lib/validations/import";

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

export function validateImportRows(rows: Record<string, unknown>[]) {
  const validRows: ParsedImportRow[] = [];
  const errors: ImportErrorRecord[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const normalizedRow = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.trim(), value])
    );

    const parsed = csvRowSchema.safeParse(normalizedRow);

    if (!parsed.success) {
      errors.push({
        rowNumber,
        message: parsed.error.issues.map((issue) => issue.message).join(", "),
        rawData: normalizedRow
      });
      return;
    }

    const data = parsed.data as ImportedQuestionRow;
    const correctKey = mapChoiceIndexToKey(Number(data["Correct Answer (1-4)"]));

    validRows.push({
      question_text: data.Question,
      explanation: data.Explanation,
      difficulty: data.Difficulty,
      subject: data.Subject,
      topic: data.Topic,
      choices: [
        { choice_key: "A", choice_text: data["Choice 1"], is_correct: correctKey === "A" },
        { choice_key: "B", choice_text: data["Choice 2"], is_correct: correctKey === "B" },
        { choice_key: "C", choice_text: data["Choice 3"], is_correct: correctKey === "C" },
        { choice_key: "D", choice_text: data["Choice 4"], is_correct: correctKey === "D" }
      ]
    });
  });

  return {
    headers: IMPORT_HEADERS,
    validRows,
    errors,
    summary: {
      totalRows: rows.length,
      successRows: validRows.length,
      failedRows: errors.length
    }
  };
}
