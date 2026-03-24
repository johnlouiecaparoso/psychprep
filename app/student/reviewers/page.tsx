import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <CardContent className="space-y-3">
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviewer PDFs available yet.</p>
          ) : (
            materials.map((material) => (
              <div key={material.id} className="rounded-2xl bg-muted/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{material.title}</p>
                    <p className="text-sm text-muted-foreground">{material.subject} | {material.topic}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{material.description}</p>
                  </div>
                  <Link href={`/api/review-materials/${material.id}`} target="_blank" className="text-sm font-semibold text-primary">
                    Read PDF
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
