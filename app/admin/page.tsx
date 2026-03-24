import { AppShell } from "@/components/app-shell";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { WeakTopicsChart } from "@/components/charts/weak-topics-chart";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { performanceData, sampleAdminStats, weakTopics } from "@/lib/mock-data";

export default function AdminPage() {
  return (
    <AppShell
      role="admin"
      title="Admin dashboard"
      description="Monitor import quality, platform usage, difficult questions, and overall student performance."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sampleAdminStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Student performance overview</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={performanceData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Most difficult topics</CardTitle>
          </CardHeader>
          <CardContent>
            <WeakTopicsChart data={weakTopics} />
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
