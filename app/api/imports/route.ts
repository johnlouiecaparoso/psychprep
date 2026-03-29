import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { persistUploadBatch } from "@/lib/supabase/import-service";
import type { ImportErrorRecord, ImportType, ParsedImportRow } from "@/lib/types";

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

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const role = profile?.role ?? user.user_metadata?.role;

    if (role !== "admin" && role !== "instructor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      fileName: string;
      importType: ImportType;
      validRows: ParsedImportRow[];
      errors: ImportErrorRecord[];
    };

    const uploadId = await persistUploadBatch({
      supabase: createAdminClient(),
      uploadedBy: user.id,
      fileName: body.fileName,
      importType: body.importType,
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
