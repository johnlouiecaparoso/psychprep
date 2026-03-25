"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, AlertTriangle, Clock3, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import type { ReviewQuestion } from "@/lib/types";

type DraftPayload = {
  currentIndex: number;
  timeLeft: number;
  answers: Record<string, "A" | "B" | "C" | "D">;
  updatedAt: string;
};

function getDraftKey(sessionKey: string) {
  return `mock-exam-draft:${sessionKey}`;
}

export function MockExamClient({
  examId,
  questions,
  mode = "mock",
  sessionKey,
  initialDurationSeconds
}: {
  examId: string;
  questions: ReviewQuestion[];
  mode?: "mock" | "quiz";
  sessionKey: string;
  initialDurationSeconds: number;
}) {
  const router = useRouter();
  const duration = Math.max(initialDurationSeconds, 60);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(duration);
  const [answers, setAnswers] = React.useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");
  const [draftStatus, setDraftStatus] = React.useState("Autosaving your progress...");
  const [isOffline, setIsOffline] = React.useState(false);
  const [hasHydratedDraft, setHasHydratedDraft] = React.useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setIsOffline(!window.navigator.onLine);
    setIsPaletteOpen(window.innerWidth >= 1024);

    try {
      const rawDraft = window.localStorage.getItem(getDraftKey(sessionKey));
      if (rawDraft) {
        const parsedDraft = JSON.parse(rawDraft) as DraftPayload;
        setCurrentIndex(Math.min(Math.max(parsedDraft.currentIndex ?? 0, 0), Math.max(questions.length - 1, 0)));
        setTimeLeft(typeof parsedDraft.timeLeft === "number" ? parsedDraft.timeLeft : duration);
        setAnswers(parsedDraft.answers ?? {});
        setDraftStatus(`Recovered your saved ${mode} from ${new Date(parsedDraft.updatedAt).toLocaleString()}.`);
      } else {
        setTimeLeft(duration);
        setDraftStatus("Autosaving your progress...");
      }
    } catch (_error) {
      setTimeLeft(duration);
      setDraftStatus("Could not restore an older draft, but autosave is active now.");
    } finally {
      setHasHydratedDraft(true);
    }
  }, [duration, mode, questions.length, sessionKey]);

  React.useEffect(() => {
    if (!hasHydratedDraft) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hasHydratedDraft]);

  React.useEffect(() => {
    if (!hasHydratedDraft || typeof window === "undefined") {
      return;
    }

    const draft: DraftPayload = {
      currentIndex,
      timeLeft,
      answers,
      updatedAt: new Date().toISOString()
    };

    window.localStorage.setItem(getDraftKey(sessionKey), JSON.stringify(draft));
    setDraftStatus(`Progress saved locally at ${new Date(draft.updatedAt).toLocaleTimeString()}.`);
  }, [answers, currentIndex, hasHydratedDraft, sessionKey, timeLeft]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (Object.keys(answers).length === 0) {
        return;
      }

      event.preventDefault();
      event.returnValue = "Your exam progress is saved locally. Are you sure you want to leave?";
    };

    const handleOffline = () => {
      setIsOffline(true);
      setDraftStatus(`You are offline. Your ${mode} answers are saved locally and will still be here when you return.`);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setDraftStatus(`You are back online. Your saved ${mode} progress is still intact.`);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [answers, mode]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  function selectChoice(choiceKey: "A" | "B" | "C" | "D") {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: choiceKey }));
  }

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setSubmitError("");

      const payload = Object.entries(answers).map(([questionId, selectedChoice]) => ({
        questionId,
        selectedChoice
      }));

      if (payload.length === 0) {
        throw new Error("Select at least one answer before submitting.");
      }

      const response = await fetch("/api/mock-exams/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mockExamId: examId,
          answers: payload
        })
      });

      const data = (await response.json()) as { attemptId?: string; error?: string };

      if (!response.ok || !data.attemptId) {
        throw new Error(data.error ?? `Failed to submit ${mode}.`);
      }

      window.localStorage.removeItem(getDraftKey(sessionKey));
      router.push(`/student/results/${data.attemptId}`);
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : `Failed to submit ${mode}.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">No questions found for this session.</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{mode === "quiz" ? "Quiz in progress" : "Mock exam in progress"}</CardTitle>
            <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
              <Clock3 className="h-4 w-4" />
              {minutes}:{seconds}
            </div>
          </div>
          <Progress value={progress} />
          <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-muted-foreground">
            <p>
              Question {currentIndex + 1} of {questions.length}
            </p>
            <p>{draftStatus}</p>
          </div>
          {isOffline ? (
            <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <WifiOff className="h-4 w-4" />
              You are offline. Keep answering if needed. Your current progress is saved locally.
            </div>
          ) : null}
          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <AlertTriangle className="h-4 w-4" />
            If you leave the page, refresh, or lose connection, this {mode === "quiz" ? "quiz" : "exam"} will reopen at your saved question on this device.
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{currentQuestion.subject}</p>
            <h2 className="text-base font-semibold leading-7 sm:text-lg sm:leading-8">{currentQuestion.question_text}</h2>
          </div>

          <div className="space-y-3">
            {currentQuestion.choices.map((choice) => {
              const isActive = answers[currentQuestion.id] === choice.choice_key;
              return (
                <button
                  key={choice.choice_key}
                  type="button"
                  onClick={() => selectChoice(choice.choice_key)}
                  className={`w-full rounded-2xl border p-3 text-left text-sm transition sm:p-4 sm:text-base ${
                    isActive ? "border-primary bg-primary/5" : "bg-white hover:bg-muted/40"
                  }`}
                >
                  <span className="font-semibold">{choice.choice_key}.</span> {choice.choice_text}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="outline" onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))} disabled={currentIndex === 0}>
              Previous
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))} disabled={currentIndex === questions.length - 1}>
                Next
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>{mode === "quiz" ? "Submit quiz" : "Submit exam"}</Button>
                </DialogTrigger>
                <DialogContent>
                  <h3 className="text-xl font-semibold">Submit {mode === "quiz" ? "quiz" : "attempt"}?</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Once submitted, the system will compute your score, weak topics, and explanations review.
                  </p>
                  {submitError ? <p className="mt-3 text-sm text-destructive">{submitError}</p> : null}
                  <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline">Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : `Confirm ${mode === "quiz" ? "quiz" : "submit"}`}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Question palette</CardTitle>
          <button
            type="button"
            onClick={() => setIsPaletteOpen((value) => !value)}
            className="rounded-xl border p-2"
            aria-label={isPaletteOpen ? "Hide question palette" : "Show question palette"}
          >
            {isPaletteOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </CardHeader>
        {isPaletteOpen ? (
          <CardContent className="grid grid-cols-4 gap-3">
            {questions.map((question, index) => (
              <button
                key={question.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                  currentIndex === index
                    ? "border-primary bg-primary text-white"
                    : answers[question.id]
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "bg-white"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
