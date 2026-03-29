import type { ImportErrorRecord, ImportType, ParsedImportRow } from "@/lib/types";
import type { createClient } from "@/lib/supabase/server";
import type { createAdminClient } from "@/lib/supabase/admin";

type ServerClient = Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>;
const CHOICE_INSERT_CHUNK_SIZE = 200;

function getBaseFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").trim() || "Mock Exam";
}

function getImportPrefix(importType: ImportType) {
  switch (importType) {
    case "quiz":
      return "[QUIZ]";
    case "flashcard":
      return "[FLASHCARD]";
    case "exam":
    default:
      return "[EXAM]";
  }
}

function buildMockExamTitle({
  fileName,
  subject,
  hasMultipleSubjects,
  uploadId,
  importType
}: {
  fileName: string;
  subject: string;
  hasMultipleSubjects: boolean;
  uploadId: string;
  importType: ImportType;
}) {
  const shortUploadId = uploadId.slice(0, 8);
  const base = getBaseFileName(fileName);
  const prefix = getImportPrefix(importType);
  return hasMultipleSubjects
    ? `${prefix} ${base} - ${subject} [${shortUploadId}]`
    : `${prefix} ${base} [${shortUploadId}]`;
}

export async function persistUploadBatch({
  supabase,
  uploadedBy,
  fileName,
  importType,
  validRows,
  errors
}: {
  supabase: ServerClient;
  uploadedBy: string;
  fileName: string;
  importType: ImportType;
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
    const pendingChoicesPayload: {
      question_id: string;
      choice_key: "A" | "B" | "C" | "D";
      choice_text: string;
      is_correct: boolean;
    }[] = [];

    await preloadSubjects(supabase, validRows, subjectCache);
    await preloadTopics(supabase, validRows, subjectCache, topicCache);
    await preloadMockExams({
      supabase,
      fileName,
      uploadId: upload.id,
      importType,
      hasMultipleSubjects,
      subjectCache,
      mockExamCache
    });

    for (const row of validRows) {
      const subjectId = subjectCache.get(row.subject) ?? (await upsertSubject(supabase, row.subject, subjectCache));
      const topicId =
        topicCache.get(`${subjectId}:${row.topic}`) ?? (await upsertTopic(supabase, subjectId, row.topic, topicCache));
      const mockExamId = await createMockExamForUpload({
        supabase,
        subjectId,
        fileName,
        subject: row.subject,
        uploadId: upload.id,
        importType,
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

      pendingChoicesPayload.push(
        ...row.choices.map((choice) => ({
        question_id: question.id,
        choice_key: choice.choice_key,
        choice_text: choice.choice_text,
        is_correct: choice.is_correct
        }))
      );

      if (pendingChoicesPayload.length >= CHOICE_INSERT_CHUNK_SIZE) {
        const { error: choicesError } = await supabase.from("exam_choices").insert(pendingChoicesPayload.splice(0));
        if (choicesError) {
          throw choicesError;
        }
      }
    }

    if (pendingChoicesPayload.length > 0) {
      const { error: choicesError } = await supabase.from("exam_choices").insert(pendingChoicesPayload);
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

async function preloadSubjects(
  supabase: ServerClient,
  validRows: ParsedImportRow[],
  cache: Map<string, string>
) {
  const subjectNames = Array.from(new Set(validRows.map((row) => row.subject.trim()).filter(Boolean)));
  if (subjectNames.length === 0) {
    return;
  }

  const { data: existing, error: existingError } = await supabase.from("subjects").select("id, name").in("name", subjectNames);
  if (existingError) {
    throw existingError;
  }

  (existing ?? []).forEach((subject: any) => {
    cache.set(subject.name as string, subject.id as string);
  });

  const missingNames = subjectNames.filter((name) => !cache.has(name));
  if (missingNames.length === 0) {
    return;
  }

  const { data: created, error: createdError } = await supabase
    .from("subjects")
    .insert(missingNames.map((name) => ({ name })))
    .select("id, name");

  if (createdError) {
    throw createdError;
  }

  (created ?? []).forEach((subject: any) => {
    cache.set(subject.name as string, subject.id as string);
  });
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

async function preloadTopics(
  supabase: ServerClient,
  validRows: ParsedImportRow[],
  subjectCache: Map<string, string>,
  topicCache: Map<string, string>
) {
  const topicGroups = new Map<string, Set<string>>();

  validRows.forEach((row) => {
    const subjectId = subjectCache.get(row.subject);
    if (!subjectId) {
      return;
    }

    const current = topicGroups.get(subjectId) ?? new Set<string>();
    current.add(row.topic);
    topicGroups.set(subjectId, current);
  });

  for (const [subjectId, topics] of topicGroups.entries()) {
    const topicNames = Array.from(topics);
    if (topicNames.length === 0) {
      continue;
    }

    const { data: existing, error: existingError } = await supabase
      .from("topics")
      .select("id, name")
      .eq("subject_id", subjectId)
      .in("name", topicNames);

    if (existingError) {
      throw existingError;
    }

    (existing ?? []).forEach((topic: any) => {
      topicCache.set(`${subjectId}:${topic.name}`, topic.id as string);
    });

    const missingNames = topicNames.filter((name) => !topicCache.has(`${subjectId}:${name}`));
    if (missingNames.length === 0) {
      continue;
    }

    const { data: created, error: createdError } = await supabase
      .from("topics")
      .insert(missingNames.map((name) => ({ subject_id: subjectId, name })))
      .select("id, name");

    if (createdError) {
      throw createdError;
    }

    (created ?? []).forEach((topic: any) => {
      topicCache.set(`${subjectId}:${topic.name}`, topic.id as string);
    });
  }
}

async function preloadMockExams({
  supabase,
  fileName,
  uploadId,
  importType,
  hasMultipleSubjects,
  subjectCache,
  mockExamCache
}: {
  supabase: ServerClient;
  fileName: string;
  uploadId: string;
  importType: ImportType;
  hasMultipleSubjects: boolean;
  subjectCache: Map<string, string>;
  mockExamCache: Map<string, string>;
}) {
  for (const [subject, subjectId] of subjectCache.entries()) {
    const key = `${subjectId}:${uploadId}`;
    if (mockExamCache.has(key)) {
      continue;
    }

    const title = buildMockExamTitle({
      fileName,
      subject,
      hasMultipleSubjects,
      uploadId,
      importType
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
  }
}

async function createMockExamForUpload({
  supabase,
  subjectId,
  fileName,
  subject,
  uploadId,
  importType,
  hasMultipleSubjects,
  mockExamCache
}: {
  supabase: ServerClient;
  subjectId: string;
  fileName: string;
  subject: string;
  uploadId: string;
  importType: ImportType;
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
    uploadId,
    importType
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
