import { AppShell } from "@/components/app-shell";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { WeakTopicsChart } from "@/components/charts/weak-topics-chart";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getReadiness } from "@/lib/utils";
import { performanceData, recentExams, sampleStudentStats, weakTopics } from "@/lib/mock-data";

export default function StudentPage() {
  const readiness = getReadiness(82);

  return (
    <AppShell
      role="student"
      title="Student dashboard"
      description="Track readiness, weak areas, recent performance, and study momentum from one clean workspace."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sampleStudentStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subject performance</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={performanceData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weak topic detection</CardTitle>
          </CardHeader>
          <CardContent>
            <WeakTopicsChart data={weakTopics} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Recent exams</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentExams.map((exam) => (
              <div key={exam.id} className="rounded-2xl bg-muted/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{exam.title}</p>
                  <p className="text-sm font-semibold text-primary">{exam.score}%</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{exam.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Readiness indicator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className={`text-4xl font-bold ${readiness.tone}`}>82%</p>
            <p className="font-semibold">{readiness.label}</p>
            <Progress value={82} />
            <p className="text-sm text-muted-foreground">
              Keep improving Abnormal Psychology and Assessment to push into the ready range.
            </p>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
