"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ParsedImportRow } from "@/lib/types";

export function FlashcardDeck({ cards }: { cards: ParsedImportRow[] }) {
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [reviewState, setReviewState] = React.useState<Record<number, "know" | "review">>({});

  const current = cards[index];
  const progress = (Object.keys(reviewState).length / cards.length) * 100;

  function markCard(state: "know" | "review") {
    setReviewState((prev) => ({ ...prev, [index]: state }));
    setFlipped(false);
    setIndex((value) => (value + 1 < cards.length ? value + 1 : value));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Flashcards</CardTitle>
          <div className="text-sm text-muted-foreground">
            {index + 1} / {cards.length}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} />
          <button
            type="button"
            onClick={() => setFlipped((value) => !value)}
            className="flex min-h-[320px] w-full flex-col justify-between rounded-[28px] bg-gradient-to-br from-slate-50 to-emerald-50 p-8 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {flipped ? "Explanation" : current.topic}
              </span>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">
                {flipped ? current.explanation : current.question_text}
              </h3>
              {flipped ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Correct answer: {current.choices.find((choice) => choice.is_correct)?.choice_key}
                </p>
              ) : null}
            </div>
          </button>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => markCard("review")}>
              Review again
            </Button>
            <Button onClick={() => markCard("know")}>Know this</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
