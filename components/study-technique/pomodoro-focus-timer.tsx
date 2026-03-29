"use client";

import * as React from "react";
import { Clock3, Coffee, PlayCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEFAULT_POMODORO_STATE,
  getNextPomodoroState,
  getPomodoroSecondsForPhase,
  POMODORO_STATE_EVENT,
  playPomodoroRingtone,
  readPomodoroState,
  type PomodoroPhase,
  type StoredPomodoroState,
  writePomodoroState
} from "@/lib/pomodoro-state";

export function PomodoroFocusTimer() {
  const [state, setState] = React.useState<StoredPomodoroState>(DEFAULT_POMODORO_STATE);
  const [hasHydratedState, setHasHydratedState] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setState(readPomodoroState());
    setHasHydratedState(true);
  }, []);

  React.useEffect(() => {
    if (!hasHydratedState || typeof window === "undefined") {
      return;
    }

    writePomodoroState(state);
  }, [hasHydratedState, state]);

  React.useEffect(() => {
    if (!hasHydratedState || !state.isRunning || !state.endsAt) {
      return;
    }

    const timer = window.setInterval(() => {
      const remainingSeconds = Math.max(0, Math.ceil(((state.endsAt ?? Date.now()) - Date.now()) / 1000));
      setState((current) => {
        if (!current.isRunning || !current.endsAt) {
          return current;
        }

        if (remainingSeconds > 0) {
          return {
            ...current,
            secondsLeft: remainingSeconds
          };
        }

        playPomodoroRingtone();
        return getNextPomodoroState(current);
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hasHydratedState, state.endsAt, state.isRunning]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncState = () => {
      setState((current) => {
        const next = readPomodoroState();
        return JSON.stringify(current) === JSON.stringify(next) ? current : next;
      });
    };

    window.addEventListener(POMODORO_STATE_EVENT, syncState as EventListener);
    window.addEventListener("storage", syncState);

    return () => {
      window.removeEventListener(POMODORO_STATE_EVENT, syncState as EventListener);
      window.removeEventListener("storage", syncState);
    };
  }, []);

  const minutes = Math.floor(state.secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (state.secondsLeft % 60).toString().padStart(2, "0");

  function resetCycle() {
    setState((current) => ({
      ...current,
      phase: "focus",
      secondsLeft: getPomodoroSecondsForPhase("focus"),
      isRunning: false,
      endsAt: null,
      roundsCompleted: 0
    }));
  }

  function switchPhase() {
    setState((current) => {
      const nextPhase: PomodoroPhase = current.phase === "focus" ? "break" : "focus";
      return {
        ...current,
        phase: nextPhase,
        secondsLeft: getPomodoroSecondsForPhase(nextPhase),
        isRunning: false,
        endsAt: null
      };
    });
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Pomodoro focus cycle</CardTitle>
        <p className="text-sm text-muted-foreground">
          {state.phase === "focus" ? "Stay on one task until this block ends." : "Take a short break and reset before the next round."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/40 p-4">
          <div>
            <p className="text-sm text-muted-foreground">{state.phase === "focus" ? "Focus block" : "Break block"}</p>
            <p className="mt-1 text-4xl font-bold">{minutes}:{seconds}</p>
          </div>
          <div className="rounded-full bg-background px-4 py-2 text-sm font-semibold text-foreground">
            {state.roundsCompleted} round{state.roundsCompleted === 1 ? "" : "s"} completed
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Button
            onClick={() =>
              setState((current) => ({
                ...current,
                isRunning: !current.isRunning,
                endsAt: current.isRunning ? null : Date.now() + current.secondsLeft * 1000
              }))
            }
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            {state.isRunning ? "Pause timer" : "Start timer"}
          </Button>
          <Button variant="outline" onClick={switchPhase}>
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
