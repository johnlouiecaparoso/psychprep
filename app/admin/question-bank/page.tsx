import { AppShell } from "@/components/app-shell";
import { QuestionBankTable } from "@/components/tables/question-bank-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getQuestionBankRows } from "@/lib/supabase/review-service";
import type { ParsedImportRow } from "@/lib/types";

export default async function AdminQuestionBankPage() {
  const supabase = await createClient();
  let questions: ParsedImportRow[] = [];
  let errorMessage: string | null = null;

  try {
    questions = await getQuestionBankRows(supabase);
  } catch (error) {
    console.error("Admin question bank load error:", error);
    errorMessage = error instanceof Error ? error.message : "Unable to load the question bank right now.";
  }

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
          {errorMessage ? (
            <p className="text-sm text-rose-600">{errorMessage}</p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No imported questions yet. Upload an exam, quiz, or flashcard file to populate the bank.</p>
          ) : (
            <QuestionBankTable data={questions} />
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
