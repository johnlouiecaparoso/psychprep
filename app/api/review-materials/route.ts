import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function upsertSubject(admin: ReturnType<typeof createAdminClient>, name: string) {
  const { data: existing } = await admin.from("subjects").select("id").eq("name", name).maybeSingle();
  if (existing) return existing.id as string;
  const { data, error } = await admin.from("subjects").insert({ name }).select("id").single();
  if (error || !data) throw error ?? new Error("Unable to create subject.");
  return data.id as string;
}

async function upsertTopic(admin: ReturnType<typeof createAdminClient>, subjectId: string, name: string) {
  const { data: existing } = await admin
    .from("topics")
    .select("id")
    .eq("subject_id", subjectId)
    .eq("name", name)
    .maybeSingle();
  if (existing) return existing.id as string;
  const { data, error } = await admin.from("topics").insert({ subject_id: subjectId, name }).select("id").single();
  if (error || !data) throw error ?? new Error("Unable to create topic.");
  return data.id as string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const role = profile?.role ?? user.user_metadata?.role;

    if (!role || role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const topic = String(formData.get("topic") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
    }

    if (!title || !subject || !topic) {
      return NextResponse.json({ error: "Title, subject, and topic are required." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 400 });
    }

    const subjectId = await upsertSubject(admin, subject);
    const topicId = await upsertTopic(admin, subjectId, topic);

    const arrayBuffer = await file.arrayBuffer();
    const storagePath = `${subjectId}/${Date.now()}-${file.name}`;

    const { error: storageError } = await admin.storage
      .from("review-materials")
      .upload(storagePath, Buffer.from(arrayBuffer), {
        contentType: "application/pdf",
        upsert: false
      });

    if (storageError) {
      throw storageError;
    }

    const { data, error } = await admin
      .from("review_materials")
      .insert({
        title,
        description,
        subject_id: subjectId,
        topic_id: topicId,
        storage_path: storagePath,
        file_name: file.name,
        uploaded_by: user.id
      })
      .select("id")
      .single();

    if (error || !data) {
      throw error ?? new Error("Failed to save review material.");
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload review material." },
      { status: 500 }
    );
  }
}
