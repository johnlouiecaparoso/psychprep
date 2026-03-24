import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleInstructorStats } from "@/lib/mock-data";

const importLogs = [
  { file: "general-psych-mock-1.csv", success: 120, failed: 3, date: "2026-03-22" },
  { file: "assessment-drill.xlsx", success: 86, failed: 0, date: "2026-03-19" },
  { file: "abnormal-psych-set.csv", success: 75, failed: 5, date: "2026-03-15" }
];

export default function InstructorPage() {
  return (
    <AppShell
      role="instructor"
      title="Instructor dashboard"
      description="Manage uploads, review import logs, and curate question banks for board exam drills."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sampleInstructorStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Recent import logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {importLogs.map((log) => (
            <div key={log.file} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-muted/50 p-4">
              <div>
                <p className="font-semibold">{log.file}</p>
                <p className="text-sm text-muted-foreground">{log.date}</p>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-emerald-600">Success: {log.success}</span>
                <span className="text-rose-600">Failed: {log.failed}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
