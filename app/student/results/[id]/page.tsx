import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleQuestions } from "@/lib/mock-data";
import { getReadiness } from "@/lib/utils";

export default async function ResultsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const readiness = getReadiness(84);

  return (
    <AppShell
      role="student"
      title={`Results for ${id}`}
      description="Review your score breakdown, explanations, and weak topics before the next mock exam."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="mt-2 text-3xl font-bold">84%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Correct answers</p>
            <p className="mt-2 text-3xl font-bold">17 / 20</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Readiness</p>
            <p className={`mt-2 text-3xl font-bold ${readiness.tone}`}>{readiness.label}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Answer review and explanations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sampleQuestions.map((question, index) => (
            <div key={`${question.topic}-${index}`} className="rounded-2xl bg-muted/40 p-4">
              <p className="font-semibold">{question.question_text}</p>
              <p className="mt-2 text-sm text-muted-foreground">{question.explanation}</p>
              <p className="mt-3 text-sm">
                Weak topic signal: <span className="font-semibold">{question.topic}</span>
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
