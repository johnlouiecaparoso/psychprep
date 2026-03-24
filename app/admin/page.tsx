import { AppShell } from "@/components/app-shell";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { WeakTopicsChart } from "@/components/charts/weak-topics-chart";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  const [studentsRes, questionsRes, uploadsRes, failedImportsRes, attemptsRes, answersRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("exam_questions").select("id", { count: "exact", head: true }),
    supabase.from("uploads").select("id", { count: "exact", head: true }),
    supabase.from("upload_errors").select("id", { count: "exact", head: true }),
    supabase.from("exam_attempts").select("score, mock_exams(title, subjects(name))").not("submitted_at", "is", null),
    supabase.from("exam_answers").select("is_correct, exam_questions(topics(name))")
  ]);

  const subjectMap = new Map<string, number[]>();
  (attemptsRes.data ?? []).forEach((attempt: any) => {
    const subject = attempt.mock_exams?.subjects?.name;
    if (!subject) {
      return;
    }
    const values = subjectMap.get(subject) ?? [];
    values.push(Number(attempt.score ?? 0));
    subjectMap.set(subject, values);
  });

  const performanceData = Array.from(subjectMap.entries()).map(([subject, scores]) => ({
    subject,
    score: Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 100) / 100
  }));

  const topicMap = new Map<string, { correct: number; total: number }>();
  (answersRes.data ?? []).forEach((answer: any) => {
    const topic = answer.exam_questions?.topics?.name;
    if (!topic) {
      return;
    }
    const current = topicMap.get(topic) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (answer.is_correct) {
      current.correct += 1;
    }
    topicMap.set(topic, current);
  });

  const weakTopics = Array.from(topicMap.entries())
    .map(([topic, stats]) => ({
      topic,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 10000) / 100 : 0
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 4);

  const stats = [
    { label: "Total students", value: String(studentsRes.count ?? 0), helper: "Registered student accounts" },
    { label: "Total questions", value: String(questionsRes.count ?? 0), helper: "Imported into the question bank" },
    { label: "Total uploads", value: String(uploadsRes.count ?? 0), helper: "Instructor and admin import batches" },
    { label: "Failed imports", value: String(failedImportsRes.count ?? 0), helper: "Rows rejected during validation" }
  ];

  return (
    <AppShell
      role="admin"
      title="Admin dashboard"
      description="Monitor import quality, platform usage, difficult questions, and overall student performance."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Student performance overview</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No student exam attempts yet.</p>
            ) : (
              <PerformanceChart data={performanceData} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Most difficult topics</CardTitle>
          </CardHeader>
          <CardContent>
            {weakTopics.length === 0 ? (
              <p className="text-sm text-muted-foreground">No answer data yet.</p>
            ) : (
              <WeakTopicsChart data={weakTopics} />
            )}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
