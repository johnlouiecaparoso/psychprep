"use client";

import * as React from "react";
import { WifiOff } from "lucide-react";
import { FlashcardDeck } from "@/components/flashcards/flashcard-deck";
import { Card, CardContent } from "@/components/ui/card";
import { loadFlashcardDeck, saveFlashcardDeck } from "@/lib/offline-study-store";
import type { ReviewQuestion, StudyTechnique } from "@/lib/types";

export function OfflineFlashcardsClient({
  userId,
  initialCards,
  initialWeakTopics,
  studyTechnique
}: {
  userId: string | null;
  initialCards: ReviewQuestion[];
  initialWeakTopics: string[];
  studyTechnique: StudyTechnique;
}) {
  const [cards, setCards] = React.useState<ReviewQuestion[]>(initialCards);
  const [weakTopics, setWeakTopics] = React.useState<string[]>(initialWeakTopics);
  const [cacheStatus, setCacheStatus] = React.useState<"live" | "offline" | "empty">(
    initialCards.length > 0 ? "live" : "empty"
  );
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!userId) {
      return;
    }

    if (initialCards.length > 0) {
      void saveFlashcardDeck(userId, initialCards, initialWeakTopics)
        .then(() => {
          setCards(initialCards);
          setWeakTopics(initialWeakTopics);
          setCacheStatus("live");
          setSavedAt(new Date().toISOString());
        })
        .catch(() => undefined);
      return;
    }

    void loadFlashcardDeck(userId)
      .then((record) => {
        if (!record) {
          setCacheStatus("empty");
          return;
        }

        setCards(record.cards);
        setWeakTopics(record.weakTopics);
        setSavedAt(record.savedAt);
        setCacheStatus("offline");
      })
      .catch(() => {
        setCacheStatus("empty");
      });
  }, [initialCards, initialWeakTopics, userId]);

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="font-semibold">No flashcards available yet.</p>
          <p className="text-sm text-muted-foreground">
            Open flashcards while online first so this deck can be saved for offline review on your mobile PWA.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {cacheStatus === "live" ? (
        <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          Live flashcard deck loaded and saved for offline use on this device.
        </div>
      ) : null}
      {cacheStatus === "offline" ? (
        <div className="flex items-start gap-2 rounded-2xl bg-amber-100/80 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Offline flashcard deck loaded from this device{savedAt ? `, saved ${new Date(savedAt).toLocaleString()}` : ""}.
          </span>
        </div>
      ) : null}
      <FlashcardDeck cards={cards} weakTopics={weakTopics} studyTechnique={studyTechnique} />
    </div>
  );
}
