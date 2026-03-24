import { AppShell } from "@/components/app-shell";
import { FlashcardDeck } from "@/components/flashcards/flashcard-deck";
import { sampleQuestions } from "@/lib/mock-data";

export default function FlashcardsPage() {
  return (
    <AppShell
      role="student"
      title="Flashcards"
      description="Flip cards, mark confidence, and use the same question bank for spaced review."
    >
      <FlashcardDeck cards={sampleQuestions} />
    </AppShell>
  );
}
