"use client";

import * as React from "react";
import Link from "next/link";
import { DatabaseZap, Download, FileText, Layers3, Signal, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { listExamPacks, listOfflineReviewerFiles, listQueuedAttempts } from "@/lib/offline-exam-store";
import { listFlashcardDecks } from "@/lib/offline-study-store";
import { cn } from "@/lib/utils";

export function OfflineDownloadsClient({ userId }: { userId: string | null }) {
  const [examPacks, setExamPacks] = React.useState<any[]>([]);
  const [flashcardDecks, setFlashcardDecks] = React.useState<any[]>([]);
  const [reviewerFiles, setReviewerFiles] = React.useState<any[]>([]);
  const [queuedAttempts, setQueuedAttempts] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!userId) {
      return;
    }

    const loadOfflineLibrary = async () => {
      const [packs, decks, reviewers, queued] = await Promise.all([
        listExamPacks(),
        listFlashcardDecks(),
        listOfflineReviewerFiles(),
        listQueuedAttempts(userId)
      ]);

      setExamPacks(packs);
      setFlashcardDecks(decks.filter((deck) => deck.userId === userId));
      setReviewerFiles(reviewers);
      setQueuedAttempts(queued);
    };

    void loadOfflineLibrary();
  }, [userId]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Offline quiz/exam packs</p>
            <p className="mt-2 text-3xl font-bold">{examPacks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Offline flashcard decks</p>
            <p className="mt-2 text-3xl font-bold">{flashcardDecks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Offline reviewer PDFs</p>
            <p className="mt-2 text-3xl font-bold">{reviewerFiles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Queued sync items</p>
            <p className="mt-2 text-3xl font-bold">{queuedAttempts.filter((item) => !item.syncedAt).length}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Offline study packs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {examPacks.length === 0 ? <p className="text-sm text-muted-foreground">No offline quiz or exam packs downloaded yet.</p> : examPacks.map((pack) => (
            <div key={pack.id} className="rounded-2xl bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{pack.title}</p>
                  <p className="text-sm text-muted-foreground">{pack.subject} | {pack.questions.length} questions</p>
                  <p className="mt-1 text-xs text-muted-foreground">Saved {new Date(pack.savedAt).toLocaleString()}</p>
                </div>
                <Link href={`/student/offline-study?examId=${encodeURIComponent(pack.examId)}&mode=mock&duration=45`} className={cn(buttonVariants({ variant: "outline" }))}>
                  Open offline
                </Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Offline flashcards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {flashcardDecks.length === 0 ? <p className="text-sm text-muted-foreground">No offline flashcard deck saved yet.</p> : flashcardDecks.map((deck) => (
              <div key={deck.id} className="rounded-2xl bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <Layers3 className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">{deck.cards.length} flashcards ready offline</p>
                    <p className="text-sm text-muted-foreground">{deck.weakTopics.length} weak topics marked</p>
                    <p className="mt-1 text-xs text-muted-foreground">Saved {new Date(deck.savedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queuedAttempts.length === 0 ? <p className="text-sm text-muted-foreground">No offline submissions are waiting right now.</p> : queuedAttempts.map((attempt) => (
              <div key={attempt.id} className="rounded-2xl bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  {attempt.syncedAt ? <Signal className="mt-0.5 h-5 w-5 text-emerald-500" /> : <WifiOff className="mt-0.5 h-5 w-5 text-amber-500" />}
                  <div>
                    <p className="font-semibold">{attempt.mode === "quiz" ? "Offline quiz attempt" : "Offline exam attempt"}</p>
                    <p className="text-sm text-muted-foreground">{attempt.answers.length} answers | Created {new Date(attempt.createdAt).toLocaleString()}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {attempt.syncedAt ? `Synced ${new Date(attempt.syncedAt).toLocaleString()}` : "Waiting for internet to sync"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Offline reviewer PDFs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reviewerFiles.length === 0 ? <p className="text-sm text-muted-foreground">No reviewer PDFs saved offline yet.</p> : reviewerFiles.map((file) => (
            <div key={file.id} className="rounded-2xl bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">{file.title}</p>
                    <p className="text-sm text-muted-foreground">{file.subject} | {file.topic}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Saved {new Date(file.savedAt).toLocaleString()}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "outline" }))}
                  onClick={() => window.open(URL.createObjectURL(file.blob), "_blank", "noopener,noreferrer")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Open PDF
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
