import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { MockExamClient } from "@/components/exam/mock-exam-client";
import { createClient } from "@/lib/supabase/server";
import { getMockExamQuestions } from "@/lib/supabase/review-service";
import type { ReviewQuestion } from "@/lib/types";

function seededShuffle<T>(items: T[], seed: string) {
  const result = [...items];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  for (let i = result.length - 1; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const j = hash % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default async function StudentMockExamPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ shuffle?: string; seed?: string; mode?: string; limit?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const baseQuestions = await getMockExamQuestions(supabase, id);

  if (baseQuestions.length === 0) {
    notFound();
  }

  const shouldShuffle = resolvedSearchParams.shuffle === "1";
  const seed = resolvedSearchParams.seed ?? id;
  const mode = resolvedSearchParams.mode === "quiz" ? "quiz" : "mock";
  const requestedLimit = Number.parseInt(resolvedSearchParams.limit ?? String(baseQuestions.length), 10);
  const safeLimit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), baseQuestions.length)
    : baseQuestions.length;

  let preparedQuestions: ReviewQuestion[] = shouldShuffle ? seededShuffle(baseQuestions, seed) : baseQuestions;
  preparedQuestions = mode === "quiz" ? preparedQuestions.slice(0, safeLimit) : preparedQuestions;

  const topicCount = new Set(preparedQuestions.map((question) => question.topic)).size;
  const sessionKey = `${id}:${mode}:${safeLimit}:${shouldShuffle ? `shuffle:${seed}` : "ordered"}`;

  return (
    <AppShell
      role="student"
      title={mode === "quiz" ? "Quick quiz" : "Timed mock exam"}
      description={mode === "quiz" ? "Answer a shorter targeted set and tune the item limit for active recall practice." : "Take one question at a time, use the palette to jump, and submit when you're ready."}
    >
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Subject: {preparedQuestions[0].subject} | Topic coverage: {topicCount} | Items: {preparedQuestions.length} | Order: {shouldShuffle ? "Shuffled" : "Standard"}
        </CardContent>
      </Card>
      <MockExamClient examId={id} questions={preparedQuestions} mode={mode} sessionKey={sessionKey} />
    </AppShell>
  );
}
