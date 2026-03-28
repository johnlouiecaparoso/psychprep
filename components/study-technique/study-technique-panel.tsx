"use client";

import * as React from "react";
import { Brain, CheckCircle2, Clock3, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PomodoroFocusTimer } from "@/components/study-technique/pomodoro-focus-timer";
import { buildTechniqueTasks } from "@/lib/study-techniques";
import type { CurrentStudyTechnique, StudyTechniqueRecord } from "@/lib/supabase/study-technique-types";
import type { StudyTechnique } from "@/lib/types";

export function StudyTechniquePanel({
  techniques,
  currentTechnique,
  weakTopicNames,
  availableExams,
  applyingTechnique,
  onApply
}: {
  techniques: StudyTechniqueRecord[];
  currentTechnique: CurrentStudyTechnique | null;
  weakTopicNames: string[];
  availableExams: number;
  applyingTechnique: StudyTechnique | null;
  onApply: (technique: StudyTechnique) => Promise<void> | void;
}) {
  const activeTechnique = currentTechnique ?? techniques[0] ?? null;
  const tasks = buildTechniqueTasks((activeTechnique?.slug ?? "practice_test") as StudyTechnique, weakTopicNames);

  if (!activeTechnique) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Study technique module</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No study techniques are configured in Supabase yet. Run the study technique SQL seed first.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Study technique module</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pick a study mode and let the dashboard, flashcards, and review sessions adapt around it.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl bg-secondary p-4 text-secondary-foreground">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em]">
              <CheckCircle2 className="h-4 w-4" />
              Current mode
            </div>
            <p className="mt-3 text-2xl font-semibold">{activeTechnique.name}</p>
            <p className="mt-2 text-sm">{activeTechnique.impact_summary}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {techniques.map((technique) => {
              const isActive = technique.id === activeTechnique.id;

              return (
                <div key={technique.id} className={`rounded-2xl border p-4 ${isActive ? "border-primary bg-primary/5" : "border-border bg-muted/20"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-semibold">{technique.name}</p>
                    {isActive ? <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Active</span> : null}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{technique.description}</p>
                  <p className="mt-3 text-sm">{technique.impact_summary}</p>
                  <Button
                    className="mt-4 w-full"
                    variant={isActive ? "secondary" : "default"}
                    onClick={() => onApply(technique.slug)}
                    disabled={applyingTechnique !== null}
                  >
                    {applyingTechnique === technique.slug ? "Applying..." : isActive ? "Applied" : "Apply"}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s study tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ListChecks className="h-4 w-4" />
                  {activeTechnique.dashboard_task_label}
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {activeTechnique.slug === "practice_test" ? availableExams : Math.max(weakTopicNames.length, 1)}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Brain className="h-4 w-4" />
                  Weak areas detected
                </div>
                <p className="mt-2 text-2xl font-bold">{weakTopicNames.length}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {tasks.map((task) => (
                <div key={task} className="flex items-start gap-3 rounded-2xl bg-muted/20 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{task}</span>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
              Switching study mode does not erase your progress. It changes how your next review session is guided.
            </div>
          </CardContent>
        </Card>

        {activeTechnique.slug === "pomodoro" ? <PomodoroFocusTimer /> : null}
      </div>
    </section>
  );
}
