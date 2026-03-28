import { AppShell } from "@/components/app-shell";
import { OfflineResultsClient } from "@/components/results/offline-results-client";

export default function OfflineResultsPage() {
  return (
    <AppShell
      role="student"
      title="Offline exam result"
      description="Review your offline attempt now and keep a PDF copy while the submission waits to sync."
    >
      <OfflineResultsClient />
    </AppShell>
  );
}
