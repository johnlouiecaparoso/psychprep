import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
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
      .select("storage_path")
      .eq("id", id)
      .maybeSingle();

    if (error || !material) {
      return NextResponse.json({ error: "Material not found." }, { status: 404 });
    }

    const { data: signed, error: signedError } = await admin.storage
      .from("review-materials")
      .createSignedUrl(material.storage_path, 60 * 10);

    if (signedError || !signed?.signedUrl) {
      throw signedError ?? new Error("Unable to create signed URL.");
    }

    return NextResponse.redirect(signed.signedUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to open review material." },
      { status: 500 }
    );
  }
}
