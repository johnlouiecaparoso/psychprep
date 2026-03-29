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
  const [selectedSubject, setSelectedSubject] = React.useState("all");
  const [selectedChapter, setSelectedChapter] = React.useState("all");
  const [selectedTopic, setSelectedTopic] = React.useState("all");
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
        chapterLabel: exam.chapter ?? `Chapter ${index + 1}`
      }))
    }));
  }, [exams]);
  const subjectOptions = React.useMemo(() => ["all", ...examsBySubject.map((group) => group.subject)], [examsBySubject]);
  const activeSubject = React.useMemo(
    () => examsBySubject.find((group) => group.subject === selectedSubject) ?? null,
    [examsBySubject, selectedSubject]
  );

  React.useEffect(() => {
    setOpenExamId(null);
    setSelectedChapter("all");
    setSelectedTopic("all");
  }, [selectedSubject]);

  const chapterOptions = React.useMemo(() => {
    if (!activeSubject) {
      return ["all"];
    }

    return ["all", ...Array.from(new Set(activeSubject.exams.map((exam) => exam.chapter ?? exam.chapterLabel)))];
  }, [activeSubject]);

  const topicOptions = React.useMemo(() => {
    if (!activeSubject) {
      return ["all"];
    }

    const source = selectedChapter === "all"
      ? activeSubject.exams
      : activeSubject.exams.filter((exam) => (exam.chapter ?? exam.chapterLabel) === selectedChapter);

    return ["all", ...Array.from(new Set(source.flatMap((exam) => exam.topics)))];
  }, [activeSubject, selectedChapter]);

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

    if (exam.chapter) {
      params.set("chapter", exam.chapter);
    }

    if (selectedTopic !== "all") {
      params.set("topic", selectedTopic);
    }

    router.push(`/student/mock-exams/${exam.sourceExamId}?${params.toString()}`);
  }

  if (!activeSubject) {
    return (
      <section className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={selectedSubject}
            onChange={(event) => setSelectedSubject(event.target.value)}
            className="h-11 rounded-2xl border bg-background px-4 py-2 text-sm text-foreground"
          >
            {subjectOptions.map((subject) => (
              <option key={subject} value={subject}>
                {subject === "all" ? "All subjects" : subject}
              </option>
            ))}
          </select>
          <select value="all" disabled className="h-11 rounded-2xl border bg-background px-4 py-2 text-sm text-muted-foreground">
            <option>Choose a subject first</option>
          </select>
          <select value="all" disabled className="h-11 rounded-2xl border bg-background px-4 py-2 text-sm text-muted-foreground">
            <option>Choose a chapter first</option>
          </select>
        </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {examsBySubject
          .filter(({ subject }) => selectedSubject === "all" || subject === selectedSubject)
          .map(({ subject, exams: subjectExams }) => (
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
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSelectedSubject("all")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to subjects
        </Button>
        <div className="min-w-0">
          <h2 className="break-words text-xl font-semibold sm:text-2xl">{activeSubject.subject}</h2>
          <p className="text-sm text-muted-foreground">Choose a chapter to begin.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <select
          value={selectedSubject}
          onChange={(event) => setSelectedSubject(event.target.value)}
          className="h-11 rounded-2xl border bg-background px-4 py-2 text-sm text-foreground"
        >
          {subjectOptions.map((subject) => (
            <option key={subject} value={subject}>
              {subject === "all" ? "All subjects" : subject}
            </option>
          ))}
        </select>
        <select
          value={selectedChapter}
          onChange={(event) => {
            setSelectedChapter(event.target.value);
            setSelectedTopic("all");
          }}
          className="h-11 rounded-2xl border bg-background px-4 py-2 text-sm text-foreground"
        >
          {chapterOptions.map((chapter) => (
            <option key={chapter} value={chapter}>
              {chapter === "all" ? "All chapters" : chapter}
            </option>
          ))}
        </select>
        <select
          value={selectedTopic}
          onChange={(event) => setSelectedTopic(event.target.value)}
          className="h-11 rounded-2xl border bg-background px-4 py-2 text-sm text-foreground"
        >
          {topicOptions.map((topic) => (
            <option key={topic} value={topic}>
              {topic === "all" ? "All topics" : topic}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-2">
        {activeSubject.exams
          .filter((exam) => {
            const chapterMatch = selectedChapter === "all" || (exam.chapter ?? exam.chapterLabel) === selectedChapter;
            const topicMatch = selectedTopic === "all" || exam.topics.includes(selectedTopic);
            return chapterMatch && topicMatch;
          })
          .map((exam) => {
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
                  className="flex w-full items-start justify-between gap-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{exam.chapterLabel}</CardTitle>
                      {availableOffline[exam.id] ? <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Offline ready</span> : null}
                    </div>
                    <p className="mt-2 break-words text-sm text-muted-foreground">{exam.title}</p>
                  </div>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              </CardHeader>
              <CardContent className={isOpen ? "space-y-4" : "hidden"}>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>{exam.questionCount} questions available</span>
                  <span>{exam.topicCount} topics</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {exam.topics.slice(0, 4).map((topic) => (
                    <span key={`${exam.id}-${topic}`} className="rounded-full bg-muted px-3 py-1">
                      {topic}
                    </span>
                  ))}
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button className="w-full" onClick={() => startQuiz(exam)}>
                    Start quiz
                  </Button>
                  <a
                    href={`/student/mock-exams/${exam.sourceExamId}?${new URLSearchParams({
                      ...(exam.chapter ? { chapter: exam.chapter } : {}),
                      ...(selectedTopic !== "all" ? { topic: selectedTopic } : {})
                    }).toString()}`}
                    className={cn(buttonVariants({ variant: "outline" }), "w-full")}
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
