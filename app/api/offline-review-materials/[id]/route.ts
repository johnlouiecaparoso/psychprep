import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: material, error } = await admin
      .from("review_materials")
      .select("storage_path, file_name")
      .eq("id", id)
      .maybeSingle();

    if (error || !material) {
      return NextResponse.json({ error: "Material not found." }, { status: 404 });
    }

    const { data, error: downloadError } = await admin.storage
      .from("review-materials")
      .download(material.storage_path);

    if (downloadError || !data) {
      throw downloadError ?? new Error("Unable to download review material.");
    }

    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${material.file_name ?? "reviewer.pdf"}"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to download review material." },
      { status: 500 }
    );
  }
}
