"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PomodoroFocusTimer } from "@/components/study-technique/pomodoro-focus-timer";
import type { CurrentStudyTechnique, StudyTechniqueRecord } from "@/lib/supabase/study-technique-types";
import type { StudyTechnique } from "@/lib/types";

export function StudyTechniquePanel({
  techniques,
  currentTechnique,
  weakTopicNames,
  availableExams,
  applyingTechnique,
  onApply,
  onClear
}: {
  techniques: StudyTechniqueRecord[];
  currentTechnique: CurrentStudyTechnique | null;
  weakTopicNames: string[];
  availableExams: number;
  applyingTechnique: StudyTechnique | null;
  onApply: (technique: StudyTechnique) => Promise<void> | void;
  onClear: () => Promise<void> | void;
}) {
  const activeTechnique = currentTechnique;
  const activeSlug = (activeTechnique?.slug ?? "practice_test") as StudyTechnique;

  if (techniques.length === 0) {
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
    <section className="grid gap-6">
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
            <p className="mt-3 text-2xl font-semibold">{activeTechnique?.name ?? "No active technique"}</p>
            <p className="mt-2 text-sm">
              {activeTechnique?.impact_summary ?? "Study sessions will use the normal dashboard flow until you apply a technique."}
            </p>
            {activeTechnique ? (
              <Button className="mt-4 w-full sm:w-auto" variant="outline" onClick={() => onClear()} disabled={applyingTechnique !== null}>
                Cancel current technique
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {techniques.map((technique) => {
              const isCurrent = activeTechnique ? technique.id === activeTechnique.id : false;

              return (
                <div
                  key={technique.id}
                  className={`flex h-full flex-col rounded-2xl border p-4 ${isCurrent ? "border-primary bg-primary/5" : "border-border bg-muted/20"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-semibold break-words">{technique.name}</p>
                    {isCurrent ? <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Active</span> : null}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{technique.description}</p>
                  <p className="mt-3 text-sm">{technique.impact_summary}</p>
                  <Button
                    className="mt-auto w-full"
                    variant={isCurrent ? "secondary" : "default"}
                    onClick={() => onApply(technique.slug)}
                    disabled={applyingTechnique !== null}
                  >
                    {applyingTechnique === technique.slug ? "Applying..." : isCurrent ? "Applied" : "Apply"}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {activeSlug === "pomodoro" ? <PomodoroFocusTimer /> : null}
    </section>
  );
}
