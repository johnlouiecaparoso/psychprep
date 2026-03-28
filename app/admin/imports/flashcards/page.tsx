import { AppShell } from "@/components/app-shell";
import { CsvImportPanel } from "@/components/csv-import/csv-import-panel";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminFlashcardImportsPage() {
  return (
    <AppShell
      role="admin"
      title="Flashcard imports"
      description="Upload flashcard decks separately from quizzes and exams so students can review by subject, chapter, and topic."
    >
      <Card>
        <CardContent className="space-y-2 p-6 text-sm text-muted-foreground">
          <p>Flashcards use a dedicated format with `Front` and `Back` instead of multiple-choice options.</p>
          <p>CSV format: `Front`, `Back`, `Explanation`, `Difficulty`, `Subject`, `Chapter`, `Topic`.</p>
          <a href="/samples/flashcard-import-template.csv" className="font-medium text-primary">
            Download sample flashcard template
          </a>
        </CardContent>
      </Card>
      <CsvImportPanel
        importType="flashcard"
        title="Upload flashcard CSV or Excel"
        description="These rows appear in the student flashcard deck only."
        fieldHint="Front, back, explanation, difficulty, subject, chapter, topic"
      />
    </AppShell>
  );
}
