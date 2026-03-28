"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MockExamSummary } from "@/lib/types";

export function MockExamLauncher({ exams }: { exams: MockExamSummary[] }) {
  const router = useRouter();
  const [durations, setDurations] = React.useState<Record<string, string>>({});
  const [shuffle, setShuffle] = React.useState<Record<string, boolean>>({});
  const [selectedSubject, setSelectedSubject] = React.useState<string | null>(null);
  const [openExamId, setOpenExamId] = React.useState<string | null>(null);
  const examsBySubject = React.useMemo(() => {
    const grouped = new Map<string, MockExamSummary[]>();

    exams.forEach((exam) => {
      const current = grouped.get(exam.subject) ?? [];
      current.push(exam);
      grouped.set(exam.subject, current);
    });

    return Array.from(grouped.entries()).map(([subject, subjectExams]) => ({
      subject,
      exams: subjectExams.map((exam, index) => ({
        ...exam,
        setLabel: `Chapter ${index + 1}`
      }))
    }));
  }, [exams]);
  const activeSubject = React.useMemo(
    () => examsBySubject.find((group) => group.subject === selectedSubject) ?? null,
    [examsBySubject, selectedSubject]
  );

  React.useEffect(() => {
    setOpenExamId(null);
  }, [selectedSubject]);

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

  if (!activeSubject) {
    return (
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {examsBySubject.map(({ subject, exams: subjectExams }) => (
          <button
            key={subject}
            type="button"
            onClick={() => setSelectedSubject(subject)}
            className="rounded-2xl border border-border bg-card p-6 text-left text-card-foreground shadow-soft transition-colors hover:border-primary/50 hover:bg-muted/20"
          >
            <h2 className="text-xl font-semibold">{subject}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {subjectExams.length} chapter{subjectExams.length === 1 ? "" : "s"}
            </p>
          </button>
        ))}
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => setSelectedSubject(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to subjects
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">{activeSubject.subject}</h2>
          <p className="text-sm text-muted-foreground">Choose a chapter to begin.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {activeSubject.exams.map((exam) => {
          const selectedDuration = durations[exam.id] ?? "45";
          const isShuffled = shuffle[exam.id] ?? false;
          const isOpen = openExamId === exam.id;

          return (
            <Card key={exam.id}>
              <CardHeader className="space-y-0">
                <button
                  type="button"
                  onClick={() => setOpenExamId((current) => (current === exam.id ? null : exam.id))}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <div>
                    <CardTitle>{exam.setLabel}</CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">{exam.title}</p>
                  </div>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              </CardHeader>
              <CardContent className={isOpen ? "space-y-4" : "hidden"}>
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
                  Take exam
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

