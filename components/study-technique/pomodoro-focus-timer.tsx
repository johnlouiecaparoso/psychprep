"use client";

import * as React from "react";
import { Clock3, Coffee, PlayCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export function PomodoroFocusTimer() {
  const [secondsLeft, setSecondsLeft] = React.useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = React.useState(false);
  const [phase, setPhase] = React.useState<"focus" | "break">("focus");
  const [roundsCompleted, setRoundsCompleted] = React.useState(0);

  React.useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) {
          return current - 1;
        }

        if (phase === "focus") {
          setPhase("break");
          setRoundsCompleted((value) => value + 1);
          return BREAK_SECONDS;
        }

        setPhase("focus");
        return FOCUS_SECONDS;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, phase]);

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  function resetCycle() {
    setIsRunning(false);
    setPhase("focus");
    setSecondsLeft(FOCUS_SECONDS);
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Pomodoro focus cycle</CardTitle>
        <p className="text-sm text-muted-foreground">
          {phase === "focus" ? "Stay on one task until this block ends." : "Take a short break and reset before the next round."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/40 p-4">
          <div>
            <p className="text-sm text-muted-foreground">{phase === "focus" ? "Focus block" : "Break block"}</p>
            <p className="mt-1 text-4xl font-bold">{minutes}:{seconds}</p>
          </div>
          <div className="rounded-full bg-background px-4 py-2 text-sm font-semibold text-foreground">
            {roundsCompleted} round{roundsCompleted === 1 ? "" : "s"} completed
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Button onClick={() => setIsRunning((value) => !value)}>
            <PlayCircle className="mr-2 h-4 w-4" />
            {isRunning ? "Pause timer" : "Start timer"}
          </Button>
          <Button variant="outline" onClick={() => setPhase((value) => (value === "focus" ? "break" : "focus"))}>
            <Coffee className="mr-2 h-4 w-4" />
            Switch phase
          </Button>
          <Button variant="secondary" onClick={resetCycle}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset cycle
          </Button>
        </div>

        <div className="flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
          Use this with flashcards or quizzes to keep study time structured into 25-minute focus blocks and 5-minute breaks.
        </div>
      </CardContent>
    </Card>
  );
}
