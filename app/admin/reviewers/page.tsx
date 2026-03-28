import { ReviewerUploadPanel } from "@/components/reviewers/reviewer-upload-panel";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getReviewMaterials } from "@/lib/supabase/review-materials-service";

export default async function AdminReviewersPage() {
  const supabase = await createClient();
  const materials = await getReviewMaterials(supabase);

  return (
    <AppShell
      role="admin"
      title="Reviewer library"
      description="Upload and manage reviewer PDFs separately from exam, quiz, and flashcard imports."
    >
      <Card>
        <CardHeader>
          <CardTitle>Reviewer upload format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Reviewer uploads are PDF-based, not question-bank CSV-based.</p>
          <p>Required fields: `Title`, `Description`, `Subject`, `Topic`, plus the actual PDF file.</p>
          <a href="/samples/reviewer-upload-template.csv" className="font-medium text-primary">
            Download reviewer metadata template
          </a>
        </CardContent>
      </Card>
      <ReviewerUploadPanel />
      <Card>
        <CardHeader>
          <CardTitle>Uploaded reviewers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviewer PDFs uploaded yet.</p>
          ) : (
            materials.map((material) => (
              <div key={material.id} className="rounded-2xl bg-muted/40 p-4">
                <p className="font-semibold">{material.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {material.subject} - {material.topic}
                </p>
                {material.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{material.description}</p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
