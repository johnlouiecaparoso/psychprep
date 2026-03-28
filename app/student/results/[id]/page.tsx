import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ResultsReport } from "@/components/results/results-report";
import { createClient } from "@/lib/supabase/server";
import { getAttemptResult } from "@/lib/supabase/review-service";

export default async function ResultsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const result = await getAttemptResult(supabase, id, user.id);

  if (!result) {
    notFound();
  }

  return (
    <AppShell
      role="student"
      title="Exam results"
      description="Review your score breakdown, explanations, and weak topics before the next mock exam."
    >
      <ResultsReport result={result} />
    </AppShell>
  );
}

