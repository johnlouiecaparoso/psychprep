import { AppShell } from "@/components/app-shell";
import { CsvImportPanel } from "@/components/csv-import/csv-import-panel";

export default function UploadPage() {
  return (
    <AppShell
      role="instructor"
      title="CSV and Excel import"
      description="Upload, preview, validate, and persist board exam questions using the required spreadsheet format."
    >
      <CsvImportPanel />
    </AppShell>
  );
}
