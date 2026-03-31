"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StudyTechniquePanel } from "@/components/study-technique/study-technique-panel";
import { useAuth } from "@/lib/auth-context";
import { DashboardService, type StudentStudyOverview, type WeakTopic } from "@/lib/supabase/dashboard-service";
import { StudyTechniqueService } from "@/lib/supabase/study-technique-client";
import type { CurrentStudyTechnique, StudyTechniqueRecord } from "@/lib/supabase/study-technique-types";
import type { StudyTechnique } from "@/lib/types";

export default function StudentStudyTechniquePage() {
  const { userId, loading: authLoading } = useAuth();
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [studyOverview, setStudyOverview] = useState<StudentStudyOverview | null>(null);
  const [studyTechniques, setStudyTechniques] = useState<StudyTechniqueRecord[]>([]);
  const [currentTechnique, setCurrentTechnique] = useState<CurrentStudyTechnique | null>(null);
  const [applyingTechnique, setApplyingTechnique] = useState<StudyTechnique | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || authLoading) {
      return;
    }

    const loadTechniqueData = async () => {
      try {
        const dashboardService = new DashboardService();
        const studyTechniqueService = new StudyTechniqueService();
        const [weakTopicsData, overviewData, techniquesData, currentTechniqueData] = await Promise.all([
          dashboardService.getWeakTopics(userId),
          dashboardService.getStudyOverview(userId),
          studyTechniqueService.getStudyTechniques(),
          studyTechniqueService.getCurrentStudyTechnique(userId)
        ]);

        setWeakTopics(weakTopicsData);
        setStudyOverview(overviewData);
        setStudyTechniques(techniquesData);
        setCurrentTechnique(currentTechniqueData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load study techniques.");
      } finally {
        setLoading(false);
      }
    };

    void loadTechniqueData();
  }, [authLoading, userId]);

  async function handleApplyTechnique(technique: StudyTechnique) {
    if (!userId) {
      return;
    }

    try {
      setApplyingTechnique(technique);
      const studyTechniqueService = new StudyTechniqueService();
      await studyTechniqueService.applyTechnique(technique);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("psychboard-active-study-technique", technique);
        window.dispatchEvent(new CustomEvent("study-technique-changed", { detail: { technique } }));
      }
      const updatedTechnique = await studyTechniqueService.getCurrentStudyTechnique(userId);
      setCurrentTechnique(updatedTechnique);
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Failed to apply study technique.");
    } finally {
      setApplyingTechnique(null);
    }
  }

  async function handleClearTechnique() {
    if (!userId) {
      return;
    }

    try {
      setApplyingTechnique("practice_test");
      const studyTechniqueService = new StudyTechniqueService();
      await studyTechniqueService.clearCurrentTechnique();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("psychboard-active-study-technique");
        window.dispatchEvent(new CustomEvent("study-technique-changed", { detail: { technique: "practice_test" } }));
      }
      setCurrentTechnique(null);
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Failed to clear study technique.");
    } finally {
      setApplyingTechnique(null);
    }
  }

  return (
    <AppShell
      role="student"
      title="Study technique"
      description="Choose the study mode you want to run with and let the review experience adapt around it."
    >
      {loading || authLoading ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Loading study techniques...</div>
      ) : error ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-rose-600">{error}</div>
      ) : (
        <StudyTechniquePanel
          techniques={studyTechniques}
          currentTechnique={currentTechnique}
          weakTopicNames={weakTopics.map((topic) => topic.topic)}
          availableExams={studyOverview?.availableExams ?? 0}
          applyingTechnique={applyingTechnique}
          onApply={handleApplyTechnique}
          onClear={handleClearTechnique}
        />
      )}
    </AppShell>
  );
}
