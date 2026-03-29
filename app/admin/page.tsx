import { AppShell } from "@/components/app-shell";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { WeakTopicsChart } from "@/components/charts/weak-topics-chart";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContentResetPanel } from "@/components/admin/content-reset-panel";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { detectImportTypeFromTitle } from "@/lib/review-content";

export default async function AdminPage() {
  const supabase = await createClient();

  const [studentsRes, studentProfilesRes, questionsRes, uploadsRes, failedImportsRes, attemptsRes, answersRes, mockExamsRes, reviewersRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("exam_questions").select("id", { count: "exact", head: true }),
    supabase.from("uploads").select("id", { count: "exact", head: true }),
    supabase.from("upload_errors").select("id", { count: "exact", head: true }),
    supabase.from("exam_attempts").select("score, mock_exams(title, subjects(name))").not("submitted_at", "is", null),
    supabase.from("exam_answers").select("is_correct, exam_questions(topics(name))"),
    supabase.from("mock_exams").select("id, title"),
    supabase.from("review_materials").select("id", { count: "exact", head: true })
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
    { label: "Total uploads", value: String(uploadsRes.count ?? 0), helper: "Admin import batches" },
    { label: "Failed imports", value: String(failedImportsRes.count ?? 0), helper: "Rows rejected during validation" }
  ];

  const contentCounts = {
    exam: 0,
    quiz: 0,
    flashcard: 0,
    reviewer: reviewersRes.count ?? 0
  };

  (mockExamsRes.data ?? []).forEach((exam: any) => {
    const type = detectImportTypeFromTitle(exam.title ?? "");
    if (type) {
      contentCounts[type] += 1;
    }
  });

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
      <Card>
        <CardHeader>
          <CardTitle>Content imports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use separate import flows for exams, quizzes, flashcards, and reviewer PDFs so students only see the right content in each dashboard.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
            <Link href="/admin/imports/exams" className={cn(buttonVariants(), "w-full xl:w-auto")}>
              Exam imports
            </Link>
            <Link href="/admin/imports/quizzes" className={cn(buttonVariants({ variant: "outline" }), "w-full xl:w-auto")}>
              Quiz imports
            </Link>
            <Link href="/admin/imports/flashcards" className={cn(buttonVariants({ variant: "outline" }), "w-full xl:w-auto")}>
              Flashcard imports
            </Link>
            <Link href="/admin/reviewers" className={cn(buttonVariants({ variant: "outline" }), "w-full xl:w-auto")}>
              Reviewer PDFs
            </Link>
          </div>
        </CardContent>
      </Card>
      <ContentResetPanel counts={contentCounts} />
      <Card>
        <CardHeader>
          <CardTitle>Recent student signups</CardTitle>
        </CardHeader>
        <CardContent>
          {(studentProfilesRes.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No student accounts found yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Signed up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(studentProfilesRes.data ?? []).map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell className="min-w-[140px]">{student.full_name || "No name yet"}</TableCell>
                    <TableCell className="min-w-[220px]">{student.email || "-"}</TableCell>
                    <TableCell className="capitalize">{student.role || "student"}</TableCell>
                    <TableCell className="min-w-[170px]">
                      {student.created_at ? new Date(student.created_at).toLocaleString() : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <section className="grid gap-5 xl:grid-cols-2">
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
