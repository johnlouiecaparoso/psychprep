"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardService, type SubjectSummary } from "@/lib/supabase/dashboard-service";

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const dashboardService = new DashboardService();
        const data = await dashboardService.getAvailableSubjects();
        setSubjects(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load subjects.");
      } finally {
        setLoading(false);
      }
    };

    void loadSubjects();
  }, []);

  return (
    <AppShell
      role="student"
      title="Subjects"
      description="Browse all available reviewer, quiz, and exam subjects from one quick-access page."
    >
      <Card>
        <CardHeader>
          <CardTitle>Available subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Loading subjects...</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          {!loading && !error ? (
            subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects available yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {subjects.map((subject) => (
                  <div key={subject.name} className="rounded-2xl bg-muted/40 p-4">
                    <p className="font-semibold">{subject.name}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {subject.examCount} chapter{subject.examCount === 1 ? "" : "s"} available
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
