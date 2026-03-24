"use client";

import * as React from "react";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import type { ParsedImportRow } from "@/lib/types";

export function MockExamClient({
  examId,
  questions
}: {
  examId: string;
  questions: ParsedImportRow[];
}) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(45 * 60);
  const [answers, setAnswers] = React.useState<Record<number, string>>({});

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  function selectChoice(choiceKey: string) {
    setAnswers((prev) => ({ ...prev, [currentIndex]: choiceKey }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Mock exam in progress</CardTitle>
            <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
              <Clock3 className="h-4 w-4" />
              {minutes}:{seconds}
            </div>
          </div>
          <Progress value={progress} />
          <p className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{currentQuestion.subject}</p>
            <h2 className="text-2xl font-semibold">{currentQuestion.question_text}</h2>
          </div>

          <div className="space-y-3">
            {currentQuestion.choices.map((choice) => {
              const isActive = answers[currentIndex] === choice.choice_key;
              return (
                <button
                  key={choice.choice_key}
                  type="button"
                  onClick={() => selectChoice(choice.choice_key)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isActive ? "border-primary bg-primary/5" : "bg-white hover:bg-muted/40"
                  }`}
                >
                  <span className="font-semibold">{choice.choice_key}.</span> {choice.choice_text}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
                disabled={currentIndex === questions.length - 1}
              >
                Next
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Submit exam</Button>
                </DialogTrigger>
                <DialogContent>
                  <h3 className="text-xl font-semibold">Submit attempt?</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Once submitted, the system will compute your score, weak topics, and explanations review.
                  </p>
                  <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline">Cancel</Button>
                    <Link
                      href={`/student/results/${examId}`}
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                    >
                      Confirm submit
                    </Link>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question palette</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-4 gap-3">
          {questions.map((_, index) => (
            <button
              key={`palette-${index + 1}`}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                currentIndex === index
                  ? "border-primary bg-primary text-white"
                  : answers[index]
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "bg-white"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
