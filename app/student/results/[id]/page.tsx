import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getAttemptResult } from "@/lib/supabase/review-service";
import { getReadiness } from "@/lib/utils";

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

  const readiness = getReadiness(result.score);

  return (
    <AppShell
      role="student"
      title="Exam results"
      description="Review your score breakdown, explanations, and weak topics before the next mock exam."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="mt-2 text-3xl font-bold">{result.score}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Correct answers</p>
            <p className="mt-2 text-3xl font-bold">{result.correctCount} / {result.totalItems}</p>
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
          <CardTitle>Weak topics</CardTitle>
        </CardHeader>
        <CardContent>
          {result.weakTopics.length === 0 ? (
            <p className="text-sm text-emerald-600">No weak topics detected in this attempt.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {result.weakTopics.map((topic) => (
                <span key={topic} className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                  {topic}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Answer review and explanations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.items.map((item) => (
            <div key={item.questionId} className="rounded-2xl bg-muted/40 p-4">
              <p className="font-semibold">{item.questionText}</p>
              <p className="mt-2 text-sm text-muted-foreground">Subject: {item.subject} | Topic: {item.topic}</p>
              <p className="mt-3 text-sm">
                Your answer: <span className={item.isCorrect ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>{item.selectedChoice ?? "No answer"}</span>
              </p>
              <p className="mt-1 text-sm">Correct answer: <span className="font-semibold">{item.correctChoice}</span></p>
              <p className="mt-3 text-sm text-muted-foreground">{item.explanation}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
