"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MockExamSummary } from "@/lib/types";

export function MockExamLauncher({ exams }: { exams: MockExamSummary[] }) {
  const router = useRouter();
  const [durations, setDurations] = React.useState<Record<string, string>>({});
  const [shuffle, setShuffle] = React.useState<Record<string, boolean>>({});

  function startExam(exam: MockExamSummary) {
    const durationMinutes = Math.max(5, Number.parseInt(durations[exam.id] ?? "45", 10) || 45).toString();
    const params = new URLSearchParams({
      duration: durationMinutes,
      seed: Date.now().toString()
    });

    if (shuffle[exam.id]) {
      params.set("shuffle", "1");
    }

    router.push(`/student/mock-exams/${exam.id}?${params.toString()}`);
  }

  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {exams.map((exam) => {
        const selectedDuration = durations[exam.id] ?? "45";
        const isShuffled = shuffle[exam.id] ?? false;

        return (
          <Card key={exam.id}>
            <CardHeader>
              <CardTitle>{exam.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{exam.subject}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{exam.questionCount} questions</span>
                <span>{exam.topicCount} topics</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Exam time in minutes</label>
                <input
                  type="number"
                  min={5}
                  max={240}
                  step={5}
                  value={selectedDuration}
                  onChange={(event) => setDurations((prev) => ({ ...prev, [exam.id]: event.target.value }))}
                  className="h-11 w-full rounded-2xl border bg-background px-4 py-2 text-sm text-foreground"
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
              <Button className="w-full" onClick={() => startExam(exam)}>
                Start exam
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

