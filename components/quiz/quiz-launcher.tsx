"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MockExamSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuizLauncher({ exams }: { exams: MockExamSummary[] }) {
  const router = useRouter();
  const [limits, setLimits] = React.useState<Record<string, string>>({});
  const [durations, setDurations] = React.useState<Record<string, string>>({});
  const [shuffle, setShuffle] = React.useState<Record<string, boolean>>({});

  function startQuiz(exam: MockExamSummary) {
    const limit = limits[exam.id] ?? String(Math.min(10, exam.questionCount));
    const defaultDuration = Math.max(Number.parseInt(limit, 10) * 2, 10);
    const duration = Math.max(5, Number.parseInt(durations[exam.id] ?? String(defaultDuration), 10) || defaultDuration).toString();
    const shouldShuffle = shuffle[exam.id] ?? true;
    const params = new URLSearchParams({
      mode: "quiz",
      limit,
      duration,
      seed: Date.now().toString()
    });

    if (shouldShuffle) {
      params.set("shuffle", "1");
    }

    router.push(`/student/mock-exams/${exam.id}?${params.toString()}`);
  }

  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {exams.map((exam) => {
        const defaultLimit = Math.min(10, exam.questionCount);
        const selectedLimit = limits[exam.id] ?? String(defaultLimit);
        const selectedDuration = durations[exam.id] ?? String(Math.max(defaultLimit * 2, 10));
        const isShuffled = shuffle[exam.id] ?? true;

        return (
          <Card key={exam.id}>
            <CardHeader>
              <CardTitle>{exam.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{exam.subject}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{exam.questionCount} questions available</span>
                <span>{exam.topicCount} topics</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Question limit</label>
                <select
                  value={selectedLimit}
                  onChange={(event) => setLimits((prev) => ({ ...prev, [exam.id]: event.target.value }))}
                  className="h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm"
                >
                  {[5, 10, 15, 20, exam.questionCount]
                    .filter((value, index, array) => value <= exam.questionCount && array.indexOf(value) === index)
                    .sort((a, b) => a - b)
                    .map((value) => (
                      <option key={`${exam.id}-${value}`} value={value}>
                        {value} items
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quiz time in minutes</label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  step={5}
                  value={selectedDuration}
                  onChange={(event) => setDurations((prev) => ({ ...prev, [exam.id]: event.target.value }))}
                  className="h-11 w-full rounded-2xl border bg-white px-4 py-2 text-sm"
                />
              </div>
              <label className="flex items-center justify-between rounded-2xl border bg-muted/30 px-4 py-3 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Shuffle className="h-4 w-4" />
                  Shuffle questions
                </span>
                <input
                  type="checkbox"
                  checked={isShuffled}
                  onChange={(event) => setShuffle((prev) => ({ ...prev, [exam.id]: event.target.checked }))}
                />
              </label>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => startQuiz(exam)}>
                  Start quiz
                </Button>
                <a
                  href={`/student/mock-exams/${exam.id}`}
                  className={cn(buttonVariants({ variant: "outline" }), "flex-1")}
                >
                  Full exam
                </a>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
