import { AppShell } from "@/components/app-shell";
import { OfflineStudyClient } from "@/components/exam/offline-study-client";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStudyTechniqueServer, getStudyTechniquesServer } from "@/lib/supabase/study-technique-server";
import type { StudyTechnique } from "@/lib/types";

export default async function OfflineStudyPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const currentTechnique = user ? await getCurrentStudyTechniqueServer(user.id) : null;
  const techniqueFallback = currentTechnique ?? (await getStudyTechniquesServer())[0] ?? null;
  const studyTechnique = (techniqueFallback?.slug ?? "practice_test") as StudyTechnique;

  return (
    <AppShell
      role="student"
      title="Offline study"
      description="Use downloaded quiz and mock exam packs even when your mobile PWA has no internet connection."
    >
      <OfflineStudyClient studyTechnique={studyTechnique} />
    </AppShell>
  );
}
