import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfflineReviewersClient } from "@/components/reviewers/offline-reviewers-client";
import { createClient } from "@/lib/supabase/server";
import { getReviewMaterials } from "@/lib/supabase/review-materials-service";

export default async function StudentReviewersPage() {
  const supabase = await createClient();
  const materials = await getReviewMaterials(supabase);

  return (
    <AppShell
      role="student"
      title="Reviewer library"
      description="Read uploaded reviewer PDFs alongside your mock exams and flashcards."
    >
      <Card>
        <CardHeader>
          <CardTitle>Reading materials</CardTitle>
        </CardHeader>
        <CardContent>
          <OfflineReviewersClient materials={materials} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
