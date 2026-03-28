import { AppShell } from "@/components/app-shell";
import { OfflineFlashcardsClient } from "@/components/flashcards/offline-flashcards-client";
import { createClient } from "@/lib/supabase/server";
import { getQuestionBankRows, getWeakTopicNamesForStudent } from "@/lib/supabase/review-service";
import { getCurrentStudyTechniqueServer, getStudyTechniquesServer } from "@/lib/supabase/study-technique-server";
import type { StudyTechnique } from "@/lib/types";

export default async function FlashcardsPage() {
  const supabase = await createClient();
  const cards = await getQuestionBankRows(supabase, "flashcard");
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const weakTopics = user ? await getWeakTopicNamesForStudent(supabase, user.id) : [];
  const currentTechnique = user ? await getCurrentStudyTechniqueServer(user.id) : null;
  const techniqueFallback = currentTechnique ?? (await getStudyTechniquesServer())[0] ?? null;
  const studyTechnique = (techniqueFallback?.slug ?? "practice_test") as StudyTechnique;

  return (
    <AppShell
      role="student"
      title="Flashcards"
      description={
        studyTechnique === "active_recall"
          ? "Active Recall mode is on. Flip cards only after you commit to an answer from memory."
          : studyTechnique === "pomodoro"
            ? "Pomodoro mode is on. Use flashcards in focused blocks and keep your breaks intentional."
            : "Flip cards, track confidence, focus weak topics, and monitor progress by subject."
      }
    >
      <OfflineFlashcardsClient
        userId={user?.id ?? null}
        initialCards={cards}
        initialWeakTopics={weakTopics}
        studyTechnique={studyTechnique}
      />
    </AppShell>
  );
}
