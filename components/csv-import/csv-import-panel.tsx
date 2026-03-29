"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Sparkles } from "lucide-react";
import { parseExamFile, validateImportRows } from "@/lib/csv/parser";
import type { ImportType, ParsedImportRow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PreviewState = {
  validRows: ParsedImportRow[];
  errors: { rowNumber: number; message: string; rawData: Record<string, unknown> }[];
  summary: { totalRows: number; successRows: number; failedRows: number };
} | null;

export function CsvImportPanel({
  importType = "exam",
  title,
  description,
  fieldHint
}: {
  importType?: ImportType;
  title?: string;
  description?: string;
  fieldHint?: string;
}) {
  const [preview, setPreview] = React.useState<PreviewState>(null);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isParsing, setIsParsing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedMessage, setSavedMessage] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [successDialogOpen, setSuccessDialogOpen] = React.useState(false);
  const importBreakdown = React.useMemo(() => {
    if (!preview) {
      return [];
    }

    const subjectMap = new Map<
      string,
      {
        rows: number;
        chapters: Set<string>;
        topics: Set<string>;
      }
    >();

    preview.validRows.forEach((row) => {
      const current = subjectMap.get(row.subject) ?? {
        rows: 0,
        chapters: new Set<string>(),
        topics: new Set<string>()
      };

      current.rows += 1;
      current.chapters.add(row.chapter?.trim() || "General");
      current.topics.add(row.topic.trim());
      subjectMap.set(row.subject, current);
    });

    return Array.from(subjectMap.entries())
      .map(([subject, stats]) => ({
        subject,
        rowCount: stats.rows,
        chapterCount: stats.chapters.size,
        topicCount: stats.topics.size,
        chapters: Array.from(stats.chapters).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }, [preview]);

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
      const result = validateImportRows(rows, importType);
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
          importType,
          validRows: preview.validRows,
          errors: preview.errors
        })
      });

      const data = (await response.json()) as { uploadId?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save import.");
      }

      setSavedMessage(`Import saved successfully. Upload ID: ${data.uploadId}`);
      setSuccessDialogOpen(true);
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
          <CardTitle>{title ?? "Upload import file"}</CardTitle>
          <CardDescription>
            {description ?? "Accepts `.csv`, `.xlsx`, and `.xls` files using the required column structure."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed bg-muted/40 p-6">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Choose an Excel or CSV file</p>
              <p className="text-sm text-muted-foreground">
                {fieldHint ?? "Question, 4 choices, correct answer, explanation, difficulty, subject, chapter, topic"}
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
              <CardTitle>Import summary</CardTitle>
              <CardDescription>
                Review the subject, chapter, and topic counts before saving so partial uploads are easy to catch.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {importBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No valid rows were found in this file.</p>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Subjects found</p>
                        <p className="mt-2 text-2xl font-bold">{importBreakdown.length}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Chapters found</p>
                        <p className="mt-2 text-2xl font-bold">
                          {importBreakdown.reduce((total, item) => total + item.chapterCount, 0)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Topics found</p>
                        <p className="mt-2 text-2xl font-bold">
                          {importBreakdown.reduce((total, item) => total + item.topicCount, 0)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Rows</TableHead>
                        <TableHead>Chapters</TableHead>
                        <TableHead>Topics</TableHead>
                        <TableHead>Chapter list</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importBreakdown.map((item) => (
                        <TableRow key={item.subject}>
                          <TableCell className="font-medium">{item.subject}</TableCell>
                          <TableCell>{item.rowCount}</TableCell>
                          <TableCell>{item.chapterCount}</TableCell>
                          <TableCell>{item.topicCount}</TableCell>
                          <TableCell className="max-w-md text-sm text-muted-foreground">
                            {item.chapters.join(", ")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>

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
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
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

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-w-md rounded-[28px] p-0">
          <div className="overflow-hidden rounded-[28px]">
            <div className="border-b border-emerald-500/10 bg-emerald-500/5 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-300">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <DialogTitle className="text-xl font-semibold text-foreground">Import successful</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Your {importType} file has been saved successfully and is now ready for the system.
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">File:</span> {fileName || "Imported file"}</p>
                <p className="mt-1"><span className="font-medium text-foreground">Saved rows:</span> {preview?.summary.successRows ?? 0}</p>
                {savedMessage ? <p className="mt-1 break-words">{savedMessage}</p> : null}
              </div>

              <div className="flex justify-end">
                <Button className="w-full sm:w-auto" onClick={() => setSuccessDialogOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

