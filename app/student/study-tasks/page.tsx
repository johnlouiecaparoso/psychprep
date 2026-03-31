"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StudyTasksPanel } from "@/components/study-technique/study-tasks-panel";
import { useAuth } from "@/lib/auth-context";
import { DashboardService, type StudentStudyOverview, type WeakTopic } from "@/lib/supabase/dashboard-service";
import { StudyTechniqueService } from "@/lib/supabase/study-technique-client";
import type { CurrentStudyTechnique } from "@/lib/supabase/study-technique-types";

export default function StudentStudyTasksPage() {
  const { userId, loading: authLoading } = useAuth();
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [studyOverview, setStudyOverview] = useState<StudentStudyOverview | null>(null);
  const [currentTechnique, setCurrentTechnique] = useState<CurrentStudyTechnique | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || authLoading) {
      return;
    }

    const loadTaskData = async () => {
      try {
        const dashboardService = new DashboardService();
        const studyTechniqueService = new StudyTechniqueService();
        const [weakTopicsData, overviewData, currentTechniqueData] = await Promise.all([
          dashboardService.getWeakTopics(userId),
          dashboardService.getStudyOverview(userId),
          studyTechniqueService.getCurrentStudyTechnique(userId)
        ]);

        setWeakTopics(weakTopicsData);
        setStudyOverview(overviewData);
        setCurrentTechnique(currentTechniqueData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load study tasks.");
      } finally {
        setLoading(false);
      }
    };

    void loadTaskData();
  }, [authLoading, userId]);

  return (
    <AppShell
      role="student"
      title="Study tasks"
      description="Plan what you will finish today and keep your recommended review tasks in one place."
    >
      {loading || authLoading ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Loading today&apos;s study tasks...</div>
      ) : error ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-rose-600">{error}</div>
      ) : (
        <StudyTasksPanel
          currentTechnique={currentTechnique}
          weakTopicNames={weakTopics.map((topic) => topic.topic)}
          availableExams={studyOverview?.availableExams ?? 0}
        />
      )}
    </AppShell>
  );
}
