"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Download, Shuffle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOfflineStudyPack } from "@/components/exam/use-offline-study-pack";
import type { MockExamSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuizLauncher({ exams }: { exams: MockExamSummary[] }) {
  const router = useRouter();
  const [limits, setLimits] = React.useState<Record<string, string>>({});
  const [durations, setDurations] = React.useState<Record<string, string>>({});
  const [shuffle, setShuffle] = React.useState<Record<string, boolean>>({});
  const [selectedSubject, setSelectedSubject] = React.useState<string | null>(null);
  const [openExamId, setOpenExamId] = React.useState<string | null>(null);
  const { downloadState, availableOffline, downloadPack, openOfflinePack } = useOfflineStudyPack(exams);
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
        chapterLabel: `Chapter ${index + 1}`
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
          const defaultLimit = Math.min(10, exam.questionCount);
          const selectedLimit = limits[exam.id] ?? String(defaultLimit);
          const selectedDuration = durations[exam.id] ?? String(Math.max(defaultLimit * 2, 10));
          const isShuffled = shuffle[exam.id] ?? true;
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
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{exam.chapterLabel}</CardTitle>
                      {availableOffline[exam.id] ? <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Offline ready</span> : null}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{exam.title}</p>
                  </div>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              </CardHeader>
              <CardContent className={isOpen ? "space-y-4" : "hidden"}>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{exam.questionCount} questions available</span>
                  <span>{exam.topicCount} topics</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Question limit</label>
                  <select
                    value={selectedLimit}
                    onChange={(event) => setLimits((prev) => ({ ...prev, [exam.id]: event.target.value }))}
                    className="h-11 w-full rounded-2xl border bg-background px-4 py-2 text-sm text-foreground"
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button variant="outline" className="w-full" onClick={() => void downloadPack(exam)}>
                    <Download className="mr-2 h-4 w-4" />
                    {downloadState[exam.id] === "downloading"
                      ? "Downloading..."
                      : downloadState[exam.id] === "saved"
                        ? "Saved offline"
                        : "Download offline"}
                  </Button>
                  {availableOffline[exam.id] ? (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() =>
                        openOfflinePack({
                          exam,
                          mode: "quiz",
                          limit: selectedLimit,
                          duration: selectedDuration,
                          shuffle: isShuffled
                        })}
                    >
                      Open offline quiz
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
