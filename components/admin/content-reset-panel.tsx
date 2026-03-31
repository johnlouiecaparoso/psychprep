"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ImportType } from "@/lib/types";

type ResettableContentType = ImportType | "reviewer";
type SubjectBreakdownEntry = {
  subject: string;
  count: number;
  chapters: { name: string; count: number }[];
};

type SubjectBreakdown = Record<ResettableContentType, SubjectBreakdownEntry[]>;

const LABELS: Record<ResettableContentType, string> = {
  exam: "Exams",
  quiz: "Quizzes",
  flashcard: "Flashcards",
  reviewer: "Reviewers"
};

export function ContentResetPanel({
  counts,
  subjectBreakdown
}: {
  counts: Record<ResettableContentType, number>;
  subjectBreakdown: SubjectBreakdown;
}) {
  const router = useRouter();
  const [busyType, setBusyType] = React.useState<ResettableContentType | null>(null);
  const [message, setMessage] = React.useState("");
  const [confirmState, setConfirmState] = React.useState<{
    contentType: ResettableContentType;
    subjectName?: string;
    chapterName?: string;
  } | null>(null);
  const [selectedSubjects, setSelectedSubjects] = React.useState<Record<ResettableContentType, string>>({
    exam: "",
    quiz: "",
    flashcard: "",
    reviewer: ""
  });
  const [selectedChapters, setSelectedChapters] = React.useState<Record<ResettableContentType, string>>({
    exam: "",
    quiz: "",
    flashcard: "",
    reviewer: ""
  });
  const [successState, setSuccessState] = React.useState<{ contentType: ResettableContentType; deletedCount: number | null } | null>(null);

  function getSelectedSubjectEntry(contentType: ResettableContentType) {
    const selectedSubject = selectedSubjects[contentType];
    if (!selectedSubject) {
      return null;
    }

    return subjectBreakdown[contentType].find((entry) => entry.subject === selectedSubject) ?? null;
  }

  function closeSuccessDialog() {
    setSuccessState(null);
    router.refresh();
  }

  async function handleReset() {
    if (!confirmState) {
      return;
    }

    try {
      setBusyType(confirmState.contentType);
      setMessage("");

      const response = await fetch("/api/admin/content/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contentType: confirmState.contentType,
          subjectName: confirmState.subjectName ?? null,
          chapterName: confirmState.chapterName ?? null
        })
      });

      const data = (await response.json()) as { deletedCount?: number; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? `Failed to clear ${LABELS[confirmState.contentType].toLowerCase()}.`);
      }

      const deletedCount = typeof data.deletedCount === "number" ? data.deletedCount : null;
      setMessage(
        `${LABELS[confirmState.contentType]}${confirmState.subjectName ? ` for ${confirmState.subjectName}` : ""}${confirmState.chapterName ? ` (${confirmState.chapterName})` : ""} cleared successfully.${deletedCount !== null ? ` Deleted: ${deletedCount}.` : ""}`
      );
      setSuccessState({ contentType: confirmState.contentType, deletedCount });
      setConfirmState(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to clear content.");
    } finally {
      setBusyType(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clear existing content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Use this before reuploading fresh content. Each action only removes that content type and its related records.
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(LABELS) as ResettableContentType[]).map((contentType) => (
            <div key={contentType} className="rounded-2xl border bg-muted/20 p-4">
              <p className="font-semibold">{LABELS[contentType]}</p>
              <p className="mt-1 text-sm text-muted-foreground">{counts[contentType]} items in the system</p>
              {subjectBreakdown[contentType].length > 0 ? (
                <div className="mt-3 space-y-2">
                  <label className="text-sm font-medium">Delete one subject only</label>
                  <select
                    value={selectedSubjects[contentType]}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSelectedSubjects((prev) => ({ ...prev, [contentType]: value }));
                      setSelectedChapters((prev) => ({ ...prev, [contentType]: "" }));
                    }}
                    className="h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select subject</option>
                    {subjectBreakdown[contentType].map((entry) => (
                      <option key={`${contentType}-${entry.subject}`} value={entry.subject}>
                        {entry.subject} ({entry.count})
                      </option>
                    ))}
                  </select>

                  {selectedSubjects[contentType] && getSelectedSubjectEntry(contentType)?.chapters?.length ? (
                    <>
                      <label className="text-sm font-medium">Optional chapter/topic filter</label>
                      <select
                        value={selectedChapters[contentType]}
                        onChange={(event) =>
                          setSelectedChapters((prev) => ({ ...prev, [contentType]: event.target.value }))
                        }
                        className="h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">All chapters/topics in selected subject</option>
                        {(getSelectedSubjectEntry(contentType)?.chapters ?? []).map((entry) => (
                          <option key={`${contentType}-${selectedSubjects[contentType]}-${entry.name}`} value={entry.name}>
                            {entry.name} ({entry.count})
                          </option>
                        ))}
                      </select>
                    </>
                  ) : null}

                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={busyType !== null || !selectedSubjects[contentType]}
                    onClick={() => {
                      setConfirmState({
                        contentType,
                        subjectName: selectedSubjects[contentType],
                        chapterName: selectedChapters[contentType] || undefined
                      });
                    }}
                  >
                    Delete selected scope
                  </Button>
                </div>
              ) : null}
              <Button
                className="mt-4 w-full"
                variant="destructive"
                disabled={busyType !== null}
                onClick={() => setConfirmState({ contentType })}
              >
                {busyType === contentType ? "Clearing..." : `Clear ${LABELS[contentType]}`}
              </Button>
            </div>
          ))}
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>

      <Dialog open={confirmState !== null} onOpenChange={(open) => (!open ? setConfirmState(null) : undefined)}>
        <DialogContent className="max-w-md rounded-[28px] border-destructive/20 p-0">
          {confirmState ? (
            <div className="overflow-hidden rounded-[28px]">
              <div className="border-b border-destructive/10 bg-destructive/5 px-6 py-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <DialogTitle className="text-xl font-semibold text-foreground">
                      Delete
                      {confirmState.subjectName ? ` ${confirmState.subjectName}` : " all"}
                      {confirmState.chapterName ? ` (${confirmState.chapterName})` : ""}
                      {` ${LABELS[confirmState.contentType].toLowerCase()}?`}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      This will permanently remove {confirmState.subjectName ? `${confirmState.subjectName} ` : "all "}
                      {confirmState.chapterName ? `(${confirmState.chapterName}) ` : ""}
                      {LABELS[confirmState.contentType].toLowerCase()} currently in the system. You can upload a new {LABELS[confirmState.contentType].slice(0, -1).toLowerCase()} file after deletion.
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-6 py-5">
                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                  This action cannot be undone.
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => setConfirmState(null)} disabled={busyType !== null}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto"
                    onClick={() => void handleReset()}
                    disabled={busyType !== null}
                  >
                    {busyType === confirmState.contentType
                      ? `Deleting ${LABELS[confirmState.contentType].toLowerCase()}...`
                      : `Delete ${LABELS[confirmState.contentType].toLowerCase()}`}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={successState !== null} onOpenChange={(open) => (!open ? closeSuccessDialog() : undefined)}>
        <DialogContent className="max-w-md rounded-[28px] p-0">
          {successState ? (
            <div className="overflow-hidden rounded-[28px]">
              <div className="border-b border-emerald-500/10 bg-emerald-500/5 px-6 py-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-300">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <DialogTitle className="text-xl font-semibold text-foreground">
                      {LABELS[successState.contentType]} deleted successfully
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      The selected {LABELS[successState.contentType].toLowerCase()} content has been removed from the system and you can upload a fresh file now.
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-6 py-5">
                <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Deleted items:</span>{" "}
                    {successState.deletedCount ?? "Completed"}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button className="w-full sm:w-auto" onClick={closeSuccessDialog}>
                    Done
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
