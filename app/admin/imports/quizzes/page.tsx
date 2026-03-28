import { AppShell } from "@/components/app-shell";
import { CsvImportPanel } from "@/components/csv-import/csv-import-panel";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminQuizImportsPage() {
  return (
    <AppShell
      role="admin"
      title="Quiz imports"
      description="Upload short drill sets that appear in the Quick Quiz dashboard with subject, chapter, and topic filters."
    >
      <Card>
        <CardContent className="space-y-2 p-6 text-sm text-muted-foreground">
          <p>Quiz imports use the same multiple-choice format as exams, but they are shown only in Quick Quiz.</p>
          <p>CSV format: `Question`, `Choice 1-4`, `Correct Answer (1-4)`, `Explanation`, `Difficulty`, `Subject`, `Chapter`, `Topic`.</p>
          <a href="/samples/quiz-import-template.csv" className="font-medium text-primary">
            Download sample quiz template
          </a>
        </CardContent>
      </Card>
      <CsvImportPanel
        importType="quiz"
        title="Upload quiz CSV or Excel"
        description="These rows become chapter-based quick quiz sets for students."
        fieldHint="Question, 4 choices, correct answer, explanation, difficulty, subject, chapter, topic"
      />
    </AppShell>
  );
}
