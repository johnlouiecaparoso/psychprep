"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { loadExamPack, saveExamPack } from "@/lib/offline-exam-store";
import type { MockExamSummary } from "@/lib/types";

type DownloadState = "idle" | "downloading" | "saved" | "error";

export function useOfflineStudyPack(exams: MockExamSummary[]) {
  const router = useRouter();
  const [downloadState, setDownloadState] = React.useState<Record<string, DownloadState>>({});
  const [availableOffline, setAvailableOffline] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    let active = true;

    const loadAvailability = async () => {
      const entries = await Promise.all(
        exams.map(async (exam) => {
          const pack = await loadExamPack(exam.id);
          return [exam.id, Boolean(pack)] as const;
        })
      );

      if (!active) {
        return;
      }

      setAvailableOffline(Object.fromEntries(entries));
    };

    void loadAvailability();

    return () => {
      active = false;
    };
  }, [exams]);

  async function downloadPack(exam: MockExamSummary) {
    try {
      setDownloadState((prev) => ({ ...prev, [exam.id]: "downloading" }));
      const params = new URLSearchParams();
      if (exam.chapter) {
        params.set("chapter", exam.chapter);
      }

      const response = await fetch(
        `/api/offline-study-pack/${exam.sourceExamId}${params.size > 0 ? `?${params.toString()}` : ""}`
      );
      const data = (await response.json()) as {
        examId?: string;
        sourceExamId?: string;
        title?: string;
        subject?: string;
        chapter?: string | null;
        questions?: any[];
        error?: string;
      };

      if (!response.ok || !data.examId || !data.questions) {
        throw new Error(data.error ?? "Failed to download offline study pack.");
      }

      await saveExamPack({
        id: `exam-pack:${exam.id}`,
        examId: exam.id,
        sourceExamId: data.sourceExamId ?? exam.sourceExamId,
        title: data.title ?? exam.title,
        subject: data.subject ?? exam.subject,
        chapter: data.chapter ?? exam.chapter ?? null,
        topic: null,
        questions: data.questions,
        savedAt: new Date().toISOString()
      });

      setAvailableOffline((prev) => ({ ...prev, [exam.id]: true }));
      setDownloadState((prev) => ({ ...prev, [exam.id]: "saved" }));
    } catch {
      setDownloadState((prev) => ({ ...prev, [exam.id]: "error" }));
    }
  }

  function openOfflinePack({
    exam,
    mode,
    limit,
    duration,
    shuffle
  }: {
    exam: MockExamSummary;
    mode: "mock" | "quiz";
    limit?: string;
    duration: string;
    shuffle: boolean;
  }) {
    const params = new URLSearchParams({
      examId: exam.id,
      mode,
      duration,
      seed: Date.now().toString()
    });

    if (exam.chapter) {
      params.set("chapter", exam.chapter);
    }

    if (mode === "quiz" && limit) {
      params.set("limit", limit);
    }

    if (shuffle) {
      params.set("shuffle", "1");
    }

    router.push(`/student/offline-study?${params.toString()}`);
  }

  return {
    downloadState,
    availableOffline,
    downloadPack,
    openOfflinePack
  };
}
