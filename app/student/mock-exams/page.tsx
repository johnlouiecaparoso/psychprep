import { AppShell } from "@/components/app-shell";
import { MockExamLauncher } from "@/components/exam/mock-exam-launcher";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getMockExamSummaries } from "@/lib/supabase/review-service";

export default async function MockExamsPage() {
  const supabase = await createClient();
  const exams = await getMockExamSummaries(supabase, "exam");

  return (
    <AppShell
      role="student"
      title="Mock exams"
      description="Choose your exam set, set your own timer, and optionally shuffle the order so you practice understanding instead of memorizing sequence."
    >
      {exams.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="font-semibold">No mock exams available yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask an admin to upload an exam CSV first so exam sets can appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <MockExamLauncher exams={exams} />
      )}
    </AppShell>
  );
}
