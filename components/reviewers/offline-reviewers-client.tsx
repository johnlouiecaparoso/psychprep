"use client";

import * as React from "react";
import Link from "next/link";
import { Download, WifiOff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { saveOfflineReviewerFile, loadOfflineReviewerFile } from "@/lib/offline-exam-store";
import type { ReviewMaterial } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OfflineReviewersClient({ materials }: { materials: ReviewMaterial[] }) {
  const [downloadState, setDownloadState] = React.useState<Record<string, "idle" | "downloading" | "saved" | "error">>({});
  const [availableOffline, setAvailableOffline] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    let active = true;

    const loadAvailability = async () => {
      const entries = await Promise.all(
        materials.map(async (material) => {
          const file = await loadOfflineReviewerFile(material.id);
          return [material.id, Boolean(file)] as const;
        })
      );

      if (active) {
        setAvailableOffline(Object.fromEntries(entries));
      }
    };

    void loadAvailability();

    return () => {
      active = false;
    };
  }, [materials]);

  async function downloadOffline(material: ReviewMaterial) {
    try {
      setDownloadState((prev) => ({ ...prev, [material.id]: "downloading" }));
      const response = await fetch(`/api/offline-review-materials/${material.id}`);
      if (!response.ok) {
        throw new Error("Failed to download reviewer PDF.");
      }
      const blob = await response.blob();

      await saveOfflineReviewerFile({
        id: `reviewer:${material.id}`,
        materialId: material.id,
        title: material.title,
        subject: material.subject,
        topic: material.topic,
        fileName: material.fileName,
        blob,
        savedAt: new Date().toISOString()
      });

      setAvailableOffline((prev) => ({ ...prev, [material.id]: true }));
      setDownloadState((prev) => ({ ...prev, [material.id]: "saved" }));
    } catch {
      setDownloadState((prev) => ({ ...prev, [material.id]: "error" }));
    }
  }

  async function openOffline(materialId: string) {
    const file = await loadOfflineReviewerFile(materialId);
    if (!file) {
      return;
    }

    const url = URL.createObjectURL(file.blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="space-y-3">
      {materials.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviewer PDFs available yet.</p>
      ) : (
        materials.map((material) => (
          <div key={material.id} className="rounded-2xl bg-muted/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{material.title}</p>
                  {availableOffline[material.id] ? <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Saved offline</span> : null}
                </div>
                <p className="text-sm text-muted-foreground">{material.subject} | {material.topic}</p>
                <p className="mt-1 text-sm text-muted-foreground">{material.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/api/review-materials/${material.id}`} target="_blank" className={cn(buttonVariants({ variant: "outline" }))}>
                  Read PDF
                </Link>
                <button
                  type="button"
                  onClick={() => void downloadOffline(material)}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadState[material.id] === "downloading"
                    ? "Saving..."
                    : downloadState[material.id] === "saved"
                      ? "Saved"
                      : "Save offline"}
                </button>
                {availableOffline[material.id] ? (
                  <button type="button" onClick={() => void openOffline(material.id)} className={cn(buttonVariants({ variant: "secondary" }))}>
                    <WifiOff className="mr-2 h-4 w-4" />
                    Open offline
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
