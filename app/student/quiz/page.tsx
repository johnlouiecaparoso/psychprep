import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { QuizLauncher } from "@/components/quiz/quiz-launcher";
import { createClient } from "@/lib/supabase/server";
import { getMockExamSummaries } from "@/lib/supabase/review-service";

export default async function QuizPage() {
  const supabase = await createClient();
  const exams = await getMockExamSummaries(supabase, "quiz");

  return (
    <AppShell
      role="student"
      title="Quick quiz"
      description="Choose a live question set, pick how many items you want, and practice with or without shuffle."
    >
      {exams.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="font-semibold">No quiz source available yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">Ask an admin to upload quiz sets first.</p>
          </CardContent>
        </Card>
      ) : (
        <QuizLauncher exams={exams} />
      )}
    </AppShell>
  );
}
