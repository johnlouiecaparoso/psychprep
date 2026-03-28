"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { loadOfflineResult } from "@/lib/offline-exam-store";
import { ResultsReport } from "@/components/results/results-report";

export function OfflineResultsClient() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId") ?? "";
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!attemptId) {
      setLoading(false);
      return;
    }

    void loadOfflineResult(attemptId)
      .then((offlineResult) => setResult(offlineResult))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading offline result...</CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          No offline result was found for this attempt on this device.
        </CardContent>
      </Card>
    );
  }

  return (
    <ResultsReport
      result={result}
      title="Offline exam result"
      description="This result was generated on-device and will sync when your connection returns."
    />
  );
}
