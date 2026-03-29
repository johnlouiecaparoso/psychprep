import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectImportTypeFromTitle } from "@/lib/review-content";
import type { ImportType } from "@/lib/types";
import type { createClient as createServerClient } from "@/lib/supabase/server";

type ResettableContentType = ImportType | "reviewer";
type ServerClient = Awaited<ReturnType<typeof createServerClient>>;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = profile?.role ?? user.user_metadata?.role;
  if (role !== "admin" && role !== "instructor") {
    throw new Error("Forbidden");
  }

  return { userId: user.id, supabase };
}

async function deleteQuestionContent(supabase: ServerClient, contentType: ImportType) {
  const { data: exams, error: examError } = await supabase
    .from("mock_exams")
    .select("id, title");

  if (examError) {
    throw examError;
  }

  const matchingExamIds = (exams ?? [])
    .filter((exam: any) => detectImportTypeFromTitle(exam.title ?? "") === contentType)
    .map((exam: any) => exam.id as string);

  if (matchingExamIds.length === 0) {
    return 0;
  }

  const { error: examsDeleteError } = await supabase.from("mock_exams").delete().in("id", matchingExamIds);
  if (examsDeleteError) {
    throw examsDeleteError;
  }

  return matchingExamIds.length;
}

async function deleteReviewers() {
  const admin = createAdminClient();
  const { data: materials, error } = await admin
    .from("review_materials")
    .select("id, storage_path");

  if (error) {
    throw error;
  }

  const paths = (materials ?? [])
    .map((item: any) => item.storage_path as string | null)
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    const { error: storageError } = await admin.storage.from("review-materials").remove(paths);
    if (storageError) {
      throw storageError;
    }
  }

  const { error: deleteError } = await admin.from("review_materials").delete().not("id", "is", null);
  if (deleteError) {
    throw deleteError;
  }

  return materials?.length ?? 0;
}

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const body = (await request.json()) as { contentType?: ResettableContentType };
    const contentType = body.contentType;

    if (!contentType || !["exam", "quiz", "flashcard", "reviewer"].includes(contentType)) {
      return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
    }

    const deletedCount = contentType === "reviewer"
      ? await deleteReviewers()
      : await deleteQuestionContent(supabase, contentType);

    return NextResponse.json({ deletedCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reset content.";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
