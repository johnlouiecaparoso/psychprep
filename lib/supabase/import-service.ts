import type { ImportErrorRecord, ParsedImportRow } from "@/lib/types";
import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

function getBaseFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").trim() || "Mock Exam";
}

function buildMockExamTitle({
  fileName,
  subject,
  hasMultipleSubjects,
  uploadId
}: {
  fileName: string;
  subject: string;
  hasMultipleSubjects: boolean;
  uploadId: string;
}) {
  const shortUploadId = uploadId.slice(0, 8);
  const base = getBaseFileName(fileName);
  return hasMultipleSubjects
    ? `${base} - ${subject} [${shortUploadId}]`
    : `${base} [${shortUploadId}]`;
}

export async function persistUploadBatch({
  supabase,
  uploadedBy,
  fileName,
  validRows,
  errors
}: {
  supabase: ServerClient;
  uploadedBy: string;
  fileName: string;
  validRows: ParsedImportRow[];
  errors: ImportErrorRecord[];
}) {
  try {
    const { data: upload, error: uploadError } = await supabase
      .from("uploads")
      .insert({
        uploaded_by: uploadedBy,
        file_name: fileName,
        total_rows: validRows.length + errors.length,
        success_rows: validRows.length,
        failed_rows: errors.length
      })
      .select("id")
      .single();

    if (uploadError || !upload) {
      throw uploadError ?? new Error("Upload record was not created.");
    }

    if (errors.length > 0) {
      const errorPayload = errors.map((item) => ({
        upload_id: upload.id,
        row_number: item.rowNumber,
        error_message: item.message,
        raw_data: item.rawData
      }));

      const { error } = await supabase.from("upload_errors").insert(errorPayload);

      if (error) {
        throw error;
      }
    }

    const subjectCache = new Map<string, string>();
    const topicCache = new Map<string, string>();
    const mockExamCache = new Map<string, string>();
    const hasMultipleSubjects = new Set(validRows.map((row) => row.subject)).size > 1;

    for (const row of validRows) {
      const subjectId = await upsertSubject(supabase, row.subject, subjectCache);
      const topicId = await upsertTopic(supabase, subjectId, row.topic, topicCache);
      const mockExamId = await createMockExamForUpload({
        supabase,
        subjectId,
        fileName,
        subject: row.subject,
        uploadId: upload.id,
        hasMultipleSubjects,
        mockExamCache
      });

      const { data: question, error: questionError } = await supabase
        .from("exam_questions")
        .insert({
          mock_exam_id: mockExamId,
          question_text: row.question_text,
          explanation: row.explanation,
          difficulty: row.difficulty,
          subject_id: subjectId,
          topic_id: topicId
        })
        .select("id")
        .single();

      if (questionError || !question) {
        throw questionError ?? new Error("Question insert failed.");
      }

      const choicesPayload = row.choices.map((choice) => ({
        question_id: question.id,
        choice_key: choice.choice_key,
        choice_text: choice.choice_text,
        is_correct: choice.is_correct
      }));

      const { error: choicesError } = await supabase.from("exam_choices").insert(choicesPayload);

      if (choicesError) {
        throw choicesError;
      }
    }

    return upload.id;
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to persist upload batch.");
  }
}

async function upsertSubject(supabase: ServerClient, name: string, cache: Map<string, string>) {
  if (cache.has(name)) {
    return cache.get(name) as string;
  }

  const { data: existing } = await supabase.from("subjects").select("id").eq("name", name).maybeSingle();

  if (existing) {
    cache.set(name, existing.id as string);
    return existing.id as string;
  }

  const { data, error } = await supabase.from("subjects").insert({ name }).select("id").single();

  if (error || !data) {
    throw error ?? new Error("Unable to upsert subject.");
  }

  cache.set(name, data.id as string);
  return data.id as string;
}

async function upsertTopic(
  supabase: ServerClient,
  subjectId: string,
  name: string,
  cache: Map<string, string>
) {
  const key = `${subjectId}:${name}`;

  if (cache.has(key)) {
    return cache.get(key) as string;
  }

  const { data: existing } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", subjectId)
    .eq("name", name)
    .maybeSingle();

  if (existing) {
    cache.set(key, existing.id as string);
    return existing.id as string;
  }

  const { data, error } = await supabase
    .from("topics")
    .insert({ subject_id: subjectId, name })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Unable to upsert topic.");
  }

  cache.set(key, data.id as string);
  return data.id as string;
}

async function createMockExamForUpload({
  supabase,
  subjectId,
  fileName,
  subject,
  uploadId,
  hasMultipleSubjects,
  mockExamCache
}: {
  supabase: ServerClient;
  subjectId: string;
  fileName: string;
  subject: string;
  uploadId: string;
  hasMultipleSubjects: boolean;
  mockExamCache: Map<string, string>;
}) {
  const key = `${subjectId}:${uploadId}`;

  if (mockExamCache.has(key)) {
    return mockExamCache.get(key) as string;
  }

  const title = buildMockExamTitle({
    fileName,
    subject,
    hasMultipleSubjects,
    uploadId
  });

  const { data, error } = await supabase
    .from("mock_exams")
    .insert({ subject_id: subjectId, title })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Unable to create mock exam for upload.");
  }

  mockExamCache.set(key, data.id as string);
  return data.id as string;
}
