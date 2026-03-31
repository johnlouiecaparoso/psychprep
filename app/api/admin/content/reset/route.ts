import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectImportTypeFromTitle } from "@/lib/review-content";
import { inferChapterLabel } from "@/lib/review-content";
import type { ImportType } from "@/lib/types";
import type { createClient as createServerClient } from "@/lib/supabase/server";

type ResettableContentType = ImportType | "reviewer";
type ServerClient = Awaited<ReturnType<typeof createServerClient>>;

function normalizeValue(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getChapterFromTopic(topicName: string | null | undefined) {
  return inferChapterLabel(topicName) ?? "General";
}

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

async function deleteQuestionContent(
  supabase: ServerClient,
  contentType: ImportType,
  subjectName?: string | null,
  chapterName?: string | null
) {
  const { data: exams, error: examError } = await supabase
    .from("mock_exams")
    .select("id, title, subjects(name)");

  if (examError) {
    throw examError;
  }

  const matchingExamIds = (exams ?? [])
    .filter((exam: any) => {
      const typeMatches = detectImportTypeFromTitle(exam.title ?? "") === contentType;
      const subjectMatches = !subjectName || (exam.subjects?.name ?? null) === subjectName;
      return typeMatches && subjectMatches;
    })
    .map((exam: any) => exam.id as string);

  if (matchingExamIds.length === 0) {
    return 0;
  }

  if (chapterName) {
    const { data: scopedQuestions, error: scopedQuestionsError } = await supabase
      .from("exam_questions")
      .select("id, mock_exam_id, topics(name)")
      .in("mock_exam_id", matchingExamIds);

    if (scopedQuestionsError) {
      throw scopedQuestionsError;
    }

    const matchingQuestionIds = (scopedQuestions ?? [])
      .filter((question: any) => {
        const chapterLabel = getChapterFromTopic(question.topics?.name ?? null);
        return normalizeValue(chapterLabel) === normalizeValue(chapterName);
      })
      .map((question: any) => question.id as string);

    if (matchingQuestionIds.length === 0) {
      return 0;
    }

    const { error: questionDeleteError } = await supabase
      .from("exam_questions")
      .delete()
      .in("id", matchingQuestionIds);

    if (questionDeleteError) {
      throw questionDeleteError;
    }

    const { data: remainingQuestions, error: remainingQuestionsError } = await supabase
      .from("exam_questions")
      .select("mock_exam_id")
      .in("mock_exam_id", matchingExamIds);

    if (remainingQuestionsError) {
      throw remainingQuestionsError;
    }

    const examsWithQuestions = new Set((remainingQuestions ?? []).map((item: any) => item.mock_exam_id as string));
    const emptyExamIds = matchingExamIds.filter((examId) => !examsWithQuestions.has(examId));

    if (emptyExamIds.length > 0) {
      const { error: emptyExamDeleteError } = await supabase.from("mock_exams").delete().in("id", emptyExamIds);
      if (emptyExamDeleteError) {
        throw emptyExamDeleteError;
      }
    }

    return matchingQuestionIds.length;
  }

  const { error: examsDeleteError } = await supabase.from("mock_exams").delete().in("id", matchingExamIds);
  if (examsDeleteError) {
    throw examsDeleteError;
  }

  return matchingExamIds.length;
}

async function deleteReviewers(subjectName?: string | null, chapterName?: string | null) {
  const admin = createAdminClient();
  const { data: materials, error } = await admin
    .from("review_materials")
    .select("id, storage_path, subject, topic");

  if (error) {
    throw error;
  }

  const scopedMaterials = (materials ?? []).filter((material: any) => {
    const subjectMatches = !subjectName || normalizeValue(material.subject ?? null) === normalizeValue(subjectName);
    const chapterMatches = !chapterName || normalizeValue(material.topic ?? null) === normalizeValue(chapterName);
    return subjectMatches && chapterMatches;
  });

  if (scopedMaterials.length === 0) {
    return 0;
  }

  const paths = scopedMaterials
    .map((item: any) => item.storage_path as string | null)
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    const { error: storageError } = await admin.storage.from("review-materials").remove(paths);
    if (storageError) {
      throw storageError;
    }
  }

  const scopedIds = scopedMaterials.map((item: any) => item.id as string);
  const { error: deleteError } = await admin.from("review_materials").delete().in("id", scopedIds);
  if (deleteError) {
    throw deleteError;
  }

  return scopedMaterials.length;
}

export async function POST(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const body = (await request.json()) as {
      contentType?: ResettableContentType;
      subjectName?: string | null;
      chapterName?: string | null;
    };
    const contentType = body.contentType;
    const subjectName = typeof body.subjectName === "string" && body.subjectName.trim() ? body.subjectName.trim() : null;
    const chapterName = typeof body.chapterName === "string" && body.chapterName.trim() ? body.chapterName.trim() : null;

    if (!contentType || !["exam", "quiz", "flashcard", "reviewer"].includes(contentType)) {
      return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
    }

    const deletedCount = contentType === "reviewer"
      ? await deleteReviewers(subjectName, chapterName)
      : await deleteQuestionContent(supabase, contentType, subjectName, chapterName);

    return NextResponse.json({ deletedCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reset content.";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
