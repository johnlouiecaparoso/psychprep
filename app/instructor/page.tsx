import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function InstructorPage() {
  const supabase = await createClient();

  const [questionsRes, uploadsRes, studentsImpactedRes, recentUploadsRes] = await Promise.all([
    supabase.from("exam_questions").select("id", { count: "exact", head: true }),
    supabase.from("uploads").select("id, total_rows, success_rows, failed_rows, file_name, created_at").order("created_at", { ascending: false }),
    supabase.from("exam_attempts").select("student_id").not("submitted_at", "is", null),
    supabase.from("uploads").select("id, file_name, success_rows, failed_rows, created_at").order("created_at", { ascending: false }).limit(5)
  ]);

  const uploads = uploadsRes.data ?? [];
  const totalUploads = uploads.length;
  const totalRows = uploads.reduce((sum: number, upload: any) => sum + (upload.total_rows ?? 0), 0);
  const successRows = uploads.reduce((sum: number, upload: any) => sum + (upload.success_rows ?? 0), 0);
  const recentSuccessRate = totalRows > 0 ? Math.round((successRows / totalRows) * 100) : 0;
  const impactedStudents = new Set((studentsImpactedRes.data ?? []).map((row: any) => row.student_id)).size;

  const stats = [
    { label: "Question bank", value: String(questionsRes.count ?? 0), helper: "Imported review questions" },
    { label: "Imports", value: String(totalUploads), helper: "Completed upload batches" },
    { label: "Recent success rate", value: `${recentSuccessRate}%`, helper: "Across saved CSV imports" },
    { label: "Students impacted", value: String(impactedStudents), helper: "Students with submitted attempts" }
  ];

  return (
    <AppShell
      role="instructor"
      title="Instructor dashboard"
      description="Manage uploads, review import logs, and curate question banks for board exam drills."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Recent import logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(recentUploadsRes.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No upload logs yet.</p>
          ) : (
            (recentUploadsRes.data ?? []).map((log: any) => (
              <div key={log.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-muted/50 p-4">
                <div>
                  <p className="font-semibold">{log.file_name}</p>
                  <p className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-emerald-600">Success: {log.success_rows}</span>
                  <span className="text-rose-600">Failed: {log.failed_rows}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
