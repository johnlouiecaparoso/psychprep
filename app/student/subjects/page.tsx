"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SubjectProgressChart } from "@/components/charts/subject-progress-chart";
import { SubjectWeaknessChart } from "@/components/charts/subject-weakness-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { DashboardService, type SubjectDashboardGraphPoint } from "@/lib/supabase/dashboard-service";

export default function StudentSubjectsPage() {
  const { userId, loading: authLoading } = useAuth();
  const [subjectGraphs, setSubjectGraphs] = useState<SubjectDashboardGraphPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubjects = async () => {
      if (authLoading) {
        return;
      }

      if (!userId) {
        setLoading(false);
        setError("Please sign in to view your subject charts.");
        return;
      }

      try {
        const dashboardService = new DashboardService();
        const graphData = await dashboardService.getSubjectDashboardGraphData(userId);
        setSubjectGraphs(graphData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load subjects.");
      } finally {
        setLoading(false);
      }
    };

    void loadSubjects();
  }, [userId, authLoading]);

  const totalTaken = subjectGraphs.reduce((sum, subject) => sum + subject.chaptersTaken, 0);
  const totalLeft = subjectGraphs.reduce((sum, subject) => sum + subject.chaptersLeft, 0);
  const totalWeak = subjectGraphs.reduce((sum, subject) => sum + subject.weakTopics, 0);

  return (
    <AppShell
      role="student"
      title="Subjects"
      description="Browse all available reviewer, quiz, and exam subjects from one quick-access page."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Chapters taken</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalTaken}</p>
            <p className="text-sm text-muted-foreground">Completed chapters from your exam attempts.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Chapters left</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalLeft}</p>
            <p className="text-sm text-muted-foreground">Remaining chapters based on available subjects.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weakness signals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalWeak}</p>
            <p className="text-sm text-muted-foreground">Topic areas below 70% accuracy.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chapter progress by subject</CardTitle>
          </CardHeader>
          <CardContent>
            {loading || authLoading ? (
              <p className="text-sm text-muted-foreground">Loading chart...</p>
            ) : subjectGraphs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subject progress yet.</p>
            ) : (
              <SubjectProgressChart
                data={subjectGraphs.map((subject) => ({
                  subject: subject.subject,
                  chaptersTaken: subject.chaptersTaken,
                  chaptersLeft: subject.chaptersLeft
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weak topics by subject</CardTitle>
          </CardHeader>
          <CardContent>
            {loading || authLoading ? (
              <p className="text-sm text-muted-foreground">Loading chart...</p>
            ) : subjectGraphs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No weakness data yet. Take a quiz or exam first.</p>
            ) : (
              <SubjectWeaknessChart
                data={subjectGraphs.map((subject) => ({
                  subject: subject.subject,
                  weakTopics: subject.weakTopics
                }))}
              />
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Available subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || authLoading ? <p className="text-sm text-muted-foreground">Loading subjects...</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {!loading && !authLoading && !error ? (
            subjectGraphs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects available yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {subjectGraphs.map((subject) => (
                  <div key={subject.subject} className="rounded-2xl bg-muted/40 p-4">
                    <p className="font-semibold">{subject.subject}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {subject.totalChapters} chapter{subject.totalChapters === 1 ? "" : "s"} available
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Taken: {subject.chaptersTaken} | Left: {subject.chaptersLeft}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}
