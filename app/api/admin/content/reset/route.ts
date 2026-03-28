import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectImportTypeFromTitle } from "@/lib/review-content";
import type { ImportType } from "@/lib/types";

type ResettableContentType = ImportType | "reviewer";

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
  if ((profile?.role ?? user.user_metadata?.role) !== "admin") {
    throw new Error("Forbidden");
  }

  return user.id;
}

async function deleteQuestionContent(contentType: ImportType) {
  const admin = createAdminClient();
  const { data: exams, error: examError } = await admin
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

  const { data: attempts, error: attemptsError } = await admin
    .from("exam_attempts")
    .select("id")
    .in("mock_exam_id", matchingExamIds);

  if (attemptsError) {
    throw attemptsError;
  }

  const attemptIds = (attempts ?? []).map((attempt: any) => attempt.id as string);
  if (attemptIds.length > 0) {
    const { error: answersDeleteError } = await admin.from("exam_answers").delete().in("attempt_id", attemptIds);
    if (answersDeleteError) {
      throw answersDeleteError;
    }

    const { error: attemptsDeleteError } = await admin.from("exam_attempts").delete().in("id", attemptIds);
    if (attemptsDeleteError) {
      throw attemptsDeleteError;
    }
  }

  const { data: questions, error: questionsError } = await admin
    .from("exam_questions")
    .select("id")
    .in("mock_exam_id", matchingExamIds);

  if (questionsError) {
    throw questionsError;
  }

  const questionIds = (questions ?? []).map((question: any) => question.id as string);
  if (questionIds.length > 0) {
    const { error: choicesDeleteError } = await admin.from("exam_choices").delete().in("question_id", questionIds);
    if (choicesDeleteError) {
      throw choicesDeleteError;
    }

    const { error: questionsDeleteError } = await admin.from("exam_questions").delete().in("id", questionIds);
    if (questionsDeleteError) {
      throw questionsDeleteError;
    }
  }

  const { error: examsDeleteError } = await admin.from("mock_exams").delete().in("id", matchingExamIds);
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
    await requireAdmin();
    const body = (await request.json()) as { contentType?: ResettableContentType };
    const contentType = body.contentType;

    if (!contentType || !["exam", "quiz", "flashcard", "reviewer"].includes(contentType)) {
      return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
    }

    const deletedCount = contentType === "reviewer"
      ? await deleteReviewers()
      : await deleteQuestionContent(contentType);

    return NextResponse.json({ deletedCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reset content.";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
