import { AppShell } from "@/components/app-shell";
import { CsvImportPanel } from "@/components/csv-import/csv-import-panel";
import { Card, CardContent } from "@/components/ui/card";

export default function UploadPage() {
  return (
    <AppShell
      role="instructor"
      title="CSV and Excel import"
      description="Upload, preview, validate, and persist board exam questions using the required spreadsheet format."
    >
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Mock exam imports also power the flashcards automatically. Use the separate Reviewer PDFs page for reading-only materials like summaries and handouts.
        </CardContent>
      </Card>
      <CsvImportPanel />
    </AppShell>
  );
}
