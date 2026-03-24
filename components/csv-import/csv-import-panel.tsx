"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { parseExamFile, validateImportRows } from "@/lib/csv/parser";
import type { ParsedImportRow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PreviewState = {
  validRows: ParsedImportRow[];
  errors: { rowNumber: number; message: string; rawData: Record<string, unknown> }[];
  summary: { totalRows: number; successRows: number; failedRows: number };
} | null;

export function CsvImportPanel() {
  const [preview, setPreview] = React.useState<PreviewState>(null);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isParsing, setIsParsing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedMessage, setSavedMessage] = React.useState("");
  const [fileName, setFileName] = React.useState("");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsParsing(true);
    setErrorMessage("");
    setSavedMessage("");

    try {
      setFileName(file.name);
      const rows = await parseExamFile(file);
      const result = validateImportRows(rows);
      setPreview({
        validRows: result.validRows,
        errors: result.errors,
        summary: result.summary
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to parse file.");
      setPreview(null);
    } finally {
      setIsParsing(false);
    }
  }

  async function handleSave() {
    try {
      if (!preview) {
        return;
      }

      setIsSaving(true);
      setErrorMessage("");
      setSavedMessage("");

      const response = await fetch("/api/imports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileName,
          validRows: preview.validRows,
          errors: preview.errors
        })
      });

      const data = (await response.json()) as { uploadId?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save import.");
      }

      setSavedMessage(`Import saved successfully. Upload ID: ${data.uploadId}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save import.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload mock exam file</CardTitle>
          <CardDescription>
            Accepts `.csv`, `.xlsx`, and `.xls` files using the required column structure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed bg-muted/40 p-6">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Choose an Excel or CSV file</p>
              <p className="text-sm text-muted-foreground">
                Question, 4 choices, correct answer, explanation, difficulty, subject, topic
              </p>
            </div>
            <input className="hidden" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
          </label>
          {isParsing ? <p className="text-sm text-muted-foreground">Validating file...</p> : null}
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        </CardContent>
      </Card>

      {preview ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Total rows</p>
                <p className="mt-2 text-3xl font-bold">{preview.summary.totalRows}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Success rows</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">{preview.summary.successRows}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">Failed rows</p>
                <p className="mt-2 text-3xl font-bold text-rose-600">{preview.summary.failedRows}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Preview valid rows</CardTitle>
              <CardDescription>Mapped choices now use A/B/C/D and the correct answer is normalized.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Correct</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.validRows.slice(0, 5).map((row) => (
                    <TableRow key={`${row.subject}-${row.topic}-${row.question_text}`}>
                      <TableCell>{row.question_text}</TableCell>
                      <TableCell>{row.subject}</TableCell>
                      <TableCell>{row.topic}</TableCell>
                      <TableCell className="capitalize">{row.difficulty}</TableCell>
                      <TableCell>{row.choices.find((choice) => choice.is_correct)?.choice_key}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validation errors</CardTitle>
              <CardDescription>Invalid rows should be saved into the `upload_errors` table during persistence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {preview.errors.length === 0 ? (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                  No validation errors found.
                </div>
              ) : (
                preview.errors.map((item) => (
                  <div
                    key={`${item.rowNumber}-${item.message}`}
                    className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-rose-700"
                  >
                    <AlertTriangle className="mt-0.5 h-5 w-5" />
                    <div>
                      <p className="font-medium">Row {item.rowNumber}</p>
                      <p className="text-sm">{item.message}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save import batch"}
            </Button>
            {savedMessage ? <p className="text-sm text-emerald-600">{savedMessage}</p> : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
