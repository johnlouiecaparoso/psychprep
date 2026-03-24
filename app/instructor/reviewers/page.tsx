import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ReviewerUploadPanel } from "@/components/reviewers/reviewer-upload-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getReviewMaterials } from "@/lib/supabase/review-materials-service";

export default async function InstructorReviewersPage() {
  const supabase = await createClient();
  const materials = await getReviewMaterials(supabase);

  return (
    <AppShell
      role="instructor"
      title="Reviewer library"
      description="Upload PDF reviewers for reading while keeping question imports focused on exams and flashcards."
    >
      <ReviewerUploadPanel />
      <Card>
        <CardHeader>
          <CardTitle>Available reviewer PDFs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviewer PDFs uploaded yet.</p>
          ) : (
            materials.map((material) => (
              <div key={material.id} className="rounded-2xl bg-muted/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{material.title}</p>
                    <p className="text-sm text-muted-foreground">{material.subject} | {material.topic}</p>
                  </div>
                  <Link href={`/api/review-materials/${material.id}`} target="_blank" className="text-sm font-semibold text-primary">
                    Open PDF
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
