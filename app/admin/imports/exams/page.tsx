import { AppShell } from "@/components/app-shell";
import { CsvImportPanel } from "@/components/csv-import/csv-import-panel";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminExamImportsPage() {
  return (
    <AppShell
      role="admin"
      title="Exam imports"
      description="Upload full mock exam sets with subject, chapter, and topic metadata for timed student exams."
    >
      <Card>
        <CardContent className="space-y-2 p-6 text-sm text-muted-foreground">
          <p>Exam imports create full exam sets for the Mock Exams dashboard.</p>
          <p>CSV format: `Question`, `Choice 1-4`, `Correct Answer (1-4)`, `Explanation`, `Difficulty`, `Subject`, `Chapter`, `Topic`.</p>
          <a href="/samples/exam-import-template.csv" className="font-medium text-primary">
            Download sample exam template
          </a>
        </CardContent>
      </Card>
      <CsvImportPanel
        importType="exam"
        title="Upload exam CSV or Excel"
        description="These rows become mock exam sets for students."
        fieldHint="Question, 4 choices, correct answer, explanation, difficulty, subject, chapter, topic"
      />
    </AppShell>
  );
}
