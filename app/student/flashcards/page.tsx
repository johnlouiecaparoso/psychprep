import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { FlashcardDeck } from "@/components/flashcards/flashcard-deck";
import { createClient } from "@/lib/supabase/server";
import { getQuestionBankRows, getWeakTopicNamesForStudent } from "@/lib/supabase/review-service";

export default async function FlashcardsPage() {
  const supabase = await createClient();
  const cards = await getQuestionBankRows(supabase);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const weakTopics = user ? await getWeakTopicNamesForStudent(supabase, user.id) : [];

  return (
    <AppShell
      role="student"
      title="Flashcards"
      description="Flip cards, track confidence, focus weak topics, and monitor progress by subject."
    >
      {cards.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="font-semibold">No flashcards available yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Flashcards are generated from imported exam questions, so upload a CSV first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <FlashcardDeck cards={cards} weakTopics={weakTopics} />
      )}
    </AppShell>
  );
}
