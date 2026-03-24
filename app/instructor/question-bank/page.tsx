import { AppShell } from "@/components/app-shell";
import { QuestionBankTable } from "@/components/tables/question-bank-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleQuestions } from "@/lib/mock-data";

export default function QuestionBankPage() {
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
          <QuestionBankTable data={sampleQuestions} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
