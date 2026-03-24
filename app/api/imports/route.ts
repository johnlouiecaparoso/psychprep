import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { persistUploadBatch } from "@/lib/supabase/import-service";
import type { ImportErrorRecord, ParsedImportRow } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      fileName: string;
      validRows: ParsedImportRow[];
      errors: ImportErrorRecord[];
    };

    const uploadId = await persistUploadBatch({
      supabase,
      uploadedBy: user.id,
      fileName: body.fileName,
      validRows: body.validRows,
      errors: body.errors
    });

    return NextResponse.json({ uploadId });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save import batch."
      },
      { status: 500 }
    );
  }
}
