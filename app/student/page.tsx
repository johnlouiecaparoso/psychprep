"use client";

import { AppShell } from "@/components/app-shell";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { WeakTopicsChart } from "@/components/charts/weak-topics-chart";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getReadiness } from "@/lib/utils";
import { DashboardService, type StudentStats, type PerformanceData, type WeakTopic, type RecentExam } from "@/lib/supabase/dashboard-service";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

export default function StudentPage() {
  const { userId, user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [recentExams, setRecentExams] = useState<RecentExam[]>([]);
  const [readinessScore, setReadinessScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userId || authLoading) return;
      
      try {
        const dashboardService = new DashboardService();
        
        const [
          statsData,
          performanceData,
          weakTopicsData,
          recentExamsData,
          readinessData
        ] = await Promise.all([
          dashboardService.getStudentStats(userId),
          dashboardService.getPerformanceData(userId),
          dashboardService.getWeakTopics(userId),
          dashboardService.getRecentExams(userId),
          dashboardService.getReadinessScore(userId)
        ]);

        setStats(statsData);
        setPerformanceData(performanceData);
        setWeakTopics(weakTopicsData);
        setRecentExams(recentExamsData);
        setReadinessScore(readinessData.score);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId, authLoading]);

  const readiness = getReadiness(readinessScore);

  if (loading || authLoading) {
    return (
      <AppShell
        role="student"
        title="Student dashboard"
        description="Track readiness, weak areas, recent performance, and study momentum from one clean workspace."
      >
        <div className="flex items-center justify-center h-64">
          <p>Loading dashboard...</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell
        role="student"
        title="Student dashboard"
        description="Track readiness, weak areas, recent performance, and study momentum from one clean workspace."
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </AppShell>
    );
  }

  const statCards = [
    { label: "Total Exams", value: stats?.totalExams?.toString() || "0", helper: "Exams completed" },
    { label: "Average Score", value: `${stats?.averageScore || 0}%`, helper: "Across all subjects" },
    { label: "Study Streak", value: `${stats?.studyStreak || 0} days`, helper: "Consecutive days" },
    { label: "Study Time", value: `${stats?.totalTime || 0} min`, helper: "Total time spent" }
  ];

  return (
    <AppShell
      role="student"
      title="Student dashboard"
      description="Track readiness, weak areas, recent performance, and study momentum from one clean workspace."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
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
            {recentExams.length === 0 ? (
              <p className="text-muted-foreground">No exams taken yet</p>
            ) : (
              recentExams.map((exam) => (
                <div key={exam.id} className="rounded-2xl bg-muted/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{exam.title}</p>
                    <p className="text-sm font-semibold text-primary">{exam.score}%</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{exam.date}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Readiness indicator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className={`text-4xl font-bold ${readiness.tone}`}>{readinessScore}%</p>
            <p className="font-semibold">{readiness.label}</p>
            <Progress value={readinessScore} />
            <p className="text-sm text-muted-foreground">
              {readinessScore >= 80 
                ? "Great job! You're ready for the exam."
                : readinessScore >= 60
                ? "Keep improving to reach optimal readiness."
                : "Focus on weak areas to build readiness."
              }
            </p>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
