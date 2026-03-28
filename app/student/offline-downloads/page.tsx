import { AppShell } from "@/components/app-shell";
import { OfflineDownloadsClient } from "@/components/offline-downloads-client";
import { createClient } from "@/lib/supabase/server";

export default async function OfflineDownloadsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <AppShell
      role="student"
      title="Offline downloads"
      description="See every saved study pack, offline flashcard deck, reviewer PDF, and queued submission on this device."
    >
      <OfflineDownloadsClient userId={user?.id ?? null} />
    </AppShell>
  );
}
