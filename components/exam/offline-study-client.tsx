"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MockExamClient } from "@/components/exam/mock-exam-client";
import { loadExamPack } from "@/lib/offline-exam-store";
import type { ReviewQuestion, StudyTechnique } from "@/lib/types";

function seededShuffle<T>(items: T[], seed: string) {
  const result = [...items];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  for (let i = result.length - 1; i > 0; i -= 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const swapIndex = hash % (i + 1);
    [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
  }
  return result;
}

export function OfflineStudyClient({ studyTechnique }: { studyTechnique: StudyTechnique }) {
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId") ?? "";
  const mode = searchParams.get("mode") === "quiz" ? "quiz" : "mock";
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const durationParam = Number.parseInt(searchParams.get("duration") ?? "", 10);
  const shouldShuffle = searchParams.get("shuffle") === "1";
  const seed = searchParams.get("seed") ?? examId;
  const [pack, setPack] = React.useState<{ title: string; subject: string; questions: ReviewQuestion[] } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!examId) {
      setLoading(false);
      return;
    }

    void loadExamPack(examId)
      .then((savedPack) => {
        if (savedPack) {
          setPack({
            title: savedPack.title,
            subject: savedPack.subject,
            questions: savedPack.questions
          });
        }
      })
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading offline study pack...</CardContent>
      </Card>
    );
  }

  if (!pack) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No offline study pack found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Download this quiz or exam while online first so it can be used offline in the PWA.</p>
        </CardContent>
      </Card>
    );
  }

  const safeLimit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), pack.questions.length) : pack.questions.length;
  const fallbackDurationMinutes = mode === "quiz" ? Math.max(safeLimit * 2, 10) : 45;
  const durationMinutes = Number.isFinite(durationParam) ? Math.min(Math.max(durationParam, 5), 240) : fallbackDurationMinutes;
  let preparedQuestions = shouldShuffle ? seededShuffle(pack.questions, seed) : pack.questions;
  preparedQuestions = mode === "quiz" ? preparedQuestions.slice(0, safeLimit) : preparedQuestions;
  const topicCount = new Set(preparedQuestions.map((question) => question.topic)).size;
  const sessionKey = `offline:${examId}:${mode}:${safeLimit}:${durationMinutes}:${shouldShuffle ? `shuffle:${seed}` : "ordered"}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Offline pack: {pack.title} | Subject: {pack.subject} | Topic coverage: {topicCount} | Items: {preparedQuestions.length} | Time: {durationMinutes} min
        </CardContent>
      </Card>
      <MockExamClient
        examId={examId}
        examTitle={pack.title}
        subject={pack.subject}
        questions={preparedQuestions}
        mode={mode}
        sessionKey={sessionKey}
        initialDurationSeconds={durationMinutes * 60}
        studyTechnique={studyTechnique}
        offlineMode
      />
    </div>
  );
}
