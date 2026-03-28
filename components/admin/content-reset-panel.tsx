"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  async function handleReset(contentType: ResettableContentType) {
    const confirmed = window.confirm(
      `Delete all ${LABELS[contentType].toLowerCase()} from the system so you can reupload them? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyType(contentType);
      setMessage("");

      const response = await fetch("/api/admin/content/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ contentType })
      });

      const data = (await response.json()) as { deletedCount?: number; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? `Failed to clear ${LABELS[contentType].toLowerCase()}.`);
      }

      setMessage(`${LABELS[contentType]} cleared successfully.${typeof data.deletedCount === "number" ? ` Deleted: ${data.deletedCount}.` : ""}`);
      router.refresh();
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
                onClick={() => void handleReset(contentType)}
              >
                {busyType === contentType ? "Clearing..." : `Clear ${LABELS[contentType]}`}
              </Button>
            </div>
          ))}
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
