"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ImportType } from "@/lib/types";

type ResettableContentType = ImportType | "reviewer";

const LABELS: Record<ResettableContentType, string> = {
  exam: "Exams",
  quiz: "Quizzes",
  flashcard: "Flashcards",
  reviewer: "Reviewers"
};

export function ContentResetPanel({
  counts
}: {
  counts: Record<ResettableContentType, number>;
}) {
  const router = useRouter();
  const [busyType, setBusyType] = React.useState<ResettableContentType | null>(null);
  const [message, setMessage] = React.useState("");
  const [confirmType, setConfirmType] = React.useState<ResettableContentType | null>(null);
  const [successState, setSuccessState] = React.useState<{ contentType: ResettableContentType; deletedCount: number | null } | null>(null);

  function closeSuccessDialog() {
    setSuccessState(null);
    router.refresh();
  }

  async function handleReset() {
    if (!confirmType) {
      return;
    }

    try {
      setBusyType(confirmType);
      setMessage("");

      const response = await fetch("/api/admin/content/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ contentType: confirmType })
      });

      const data = (await response.json()) as { deletedCount?: number; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? `Failed to clear ${LABELS[confirmType].toLowerCase()}.`);
      }

      const deletedCount = typeof data.deletedCount === "number" ? data.deletedCount : null;
      setMessage(`${LABELS[confirmType]} cleared successfully.${deletedCount !== null ? ` Deleted: ${deletedCount}.` : ""}`);
      setSuccessState({ contentType: confirmType, deletedCount });
      setConfirmType(null);
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
              <Button
                className="mt-4 w-full"
                variant="destructive"
                disabled={busyType !== null}
                onClick={() => setConfirmType(contentType)}
              >
                {busyType === contentType ? "Clearing..." : `Clear ${LABELS[contentType]}`}
              </Button>
            </div>
          ))}
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>

      <Dialog open={confirmType !== null} onOpenChange={(open) => (!open ? setConfirmType(null) : undefined)}>
        <DialogContent className="max-w-md rounded-[28px] border-destructive/20 p-0">
          {confirmType ? (
            <div className="overflow-hidden rounded-[28px]">
              <div className="border-b border-destructive/10 bg-destructive/5 px-6 py-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <DialogTitle className="text-xl font-semibold text-foreground">
                      Delete all {LABELS[confirmType].toLowerCase()}?
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      This will permanently remove all {LABELS[confirmType].toLowerCase()} currently in the system. You can upload a new {LABELS[confirmType].slice(0, -1).toLowerCase()} file after deletion.
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-6 py-5">
                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                  This action cannot be undone.
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => setConfirmType(null)} disabled={busyType !== null}>
                    Cancel
                  </Button>
                  <Button variant="destructive" className="w-full sm:w-auto" onClick={() => void handleReset()} disabled={busyType !== null}>
                    {busyType === confirmType ? `Deleting ${LABELS[confirmType].toLowerCase()}...` : `Delete ${LABELS[confirmType].toLowerCase()}`}
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
