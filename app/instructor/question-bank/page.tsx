import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getQuestionBankRows } from "@/lib/supabase/review-service";
import { QuestionBankTable } from "@/components/tables/question-bank-table";

export default async function QuestionBankPage() {
  const supabase = await createClient();
  const questions = await getQuestionBankRows(supabase);

  return (
    <AppShell
      role="instructor"
      title="Question bank"
      description="Search, filter, and manage uploaded questions by subject, topic, and difficulty."
    >
      <Card>
        <CardHeader>
          <CardTitle>Question bank browser</CardTitle>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No imported questions yet. Upload a CSV to populate the bank.</p>
          ) : (
            <QuestionBankTable data={questions} />
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
