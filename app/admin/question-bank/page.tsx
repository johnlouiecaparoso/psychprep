import { AppShell } from "@/components/app-shell";
import { QuestionBankTable } from "@/components/tables/question-bank-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getQuestionBankRows } from "@/lib/supabase/review-service";

export default async function AdminQuestionBankPage() {
  const supabase = await createClient();
  const questions = await getQuestionBankRows(supabase);

  return (
    <AppShell
      role="admin"
      title="Question bank"
      description="Browse imported quiz, exam, and flashcard content in one searchable admin question bank."
    >
      <Card>
        <CardHeader>
          <CardTitle>Question bank browser</CardTitle>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No imported questions yet. Upload an exam, quiz, or flashcard file to populate the bank.</p>
          ) : (
            <QuestionBankTable data={questions} />
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
