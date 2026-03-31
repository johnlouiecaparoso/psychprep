import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfflineReviewersClient } from "@/components/reviewers/offline-reviewers-client";
import { createClient } from "@/lib/supabase/server";
import { getReviewMaterials } from "@/lib/supabase/review-materials-service";

export default async function StudentReviewersPage() {
  const supabase = await createClient();
  const materials = await getReviewMaterials(supabase);
  const subjects = Array.from(new Set(materials.map((material) => material.subject))).sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base", numeric: true })
  );

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
      <Card>
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviewer subjects available yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <span key={subject} className="rounded-full bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {subject}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
