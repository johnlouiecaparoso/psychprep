import type { AttemptResult, MockExamSummary, ReviewQuestion } from "@/lib/types";
import type { createClient } from "@/lib/supabase/server";
import { detectImportTypeFromTitle, inferChapterLabel, stripChapterFromTopic, stripImportPrefix } from "@/lib/review-content";
import type { ImportType } from "@/lib/types";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

function mapQuestionRow(row: any): ReviewQuestion {
  return {
    id: row.id,
    mock_exam_id: row.mock_exam_id,
    question_text: row.question_text,
    explanation: row.explanation,
    difficulty: row.difficulty,
    subject: row.subjects?.name ?? "Unassigned Subject",
    topic: row.topics?.name ?? "Unassigned Topic",
    choices: (row.exam_choices ?? [])
      .map((choice: any) => ({
        choice_key: choice.choice_key,
        choice_text: choice.choice_text,
        is_correct: choice.is_correct
      }))
      .sort((a: any, b: any) => a.choice_key.localeCompare(b.choice_key))
  };
}

export async function getMockExamSummaries(
  supabase: ServerClient,
  contentType: ImportType = "exam"
): Promise<MockExamSummary[]> {
  const { data, error } = await supabase
    .from("mock_exams")
    .select("id, title, subjects(name), exam_questions(id, topic_id, topics(name))")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? [])
    .filter((exam: any) => detectImportTypeFromTitle(exam.title ?? "") === contentType)
    .map((exam: any) => {
      const topicNames = Array.from(
        new Set<string>(
          (exam.exam_questions ?? [])
            .map((question: any) => question.topics?.name)
            .filter((topicName: string | null | undefined): topicName is string => Boolean(topicName))
        )
      );
      const normalizedTitle = stripImportPrefix(exam.title ?? "");
      return {
        id: exam.id,
        title: normalizedTitle,
        subject: exam.subjects?.name ?? "Unassigned Subject",
        chapter: inferChapterLabel(topicNames[0] ?? normalizedTitle),
        topics: topicNames.map((topic) => stripChapterFromTopic(topic)),
        questionCount: exam.exam_questions?.length ?? 0,
        topicCount: new Set((exam.exam_questions ?? []).map((question: any) => question.topic_id)).size
      };
    });
}

export async function getQuestionBankRows(
  supabase: ServerClient,
  contentType?: ImportType
): Promise<ReviewQuestion[]> {
  const { data, error } = await supabase
    .from("exam_questions")
    .select(
      "id, mock_exam_id, question_text, explanation, difficulty, subjects(name), topics(name), exam_choices(choice_key, choice_text, is_correct), mock_exams(title)"
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? [])
    .filter((row: any) => !contentType || detectImportTypeFromTitle(row.mock_exams?.title ?? "") === contentType)
    .map(mapQuestionRow);
}

export async function getMockExamQuestions(supabase: ServerClient, examId: string): Promise<ReviewQuestion[]> {
  const { data, error } = await supabase
    .from("exam_questions")
    .select(
      "id, mock_exam_id, question_text, explanation, difficulty, subjects(name), topics(name), exam_choices(choice_key, choice_text, is_correct)"
    )
    .eq("mock_exam_id", examId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapQuestionRow);
}

export async function getWeakTopicNamesForStudent(supabase: ServerClient, studentId: string): Promise<string[]> {
  const { data: attempts, error: attemptsError } = await supabase
    .from("exam_attempts")
    .select("id")
    .eq("student_id", studentId)
    .not("submitted_at", "is", null);

  if (attemptsError || !attempts || attempts.length === 0) {
    return [];
  }

  const attemptIds = attempts.map((attempt: any) => attempt.id);
  const { data: answers, error: answersError } = await supabase
    .from("exam_answers")
    .select("is_correct, exam_questions(topics(name))")
    .in("attempt_id", attemptIds);

  if (answersError) {
    throw answersError;
  }

  const topicStats = new Map<string, { correct: number; total: number }>();
  (answers ?? []).forEach((answer: any) => {
    const topicName = answer.exam_questions?.topics?.name;
    if (!topicName) return;
    const current = topicStats.get(topicName) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (answer.is_correct) current.correct += 1;
    topicStats.set(topicName, current);
  });

  return Array.from(topicStats.entries())
    .map(([topic, stats]) => ({ topic, accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0 }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 4)
    .map((item) => item.topic);
}

export async function submitMockExamAttempt({
  supabase,
  studentId,
  mockExamId,
  answers
}: {
  supabase: ServerClient;
  studentId: string;
  mockExamId: string;
  answers: { questionId: string; selectedChoice: "A" | "B" | "C" | "D" }[];
}) {
  const questionIds = answers.map((answer) => answer.questionId);
  const { data: correctChoices, error: correctChoicesError } = await supabase
    .from("exam_choices")
    .select("question_id, choice_key")
    .in("question_id", questionIds)
    .eq("is_correct", true);

  if (correctChoicesError) throw correctChoicesError;

  const correctMap = new Map<string, string>();
  (correctChoices ?? []).forEach((choice: any) => {
    correctMap.set(choice.question_id, choice.choice_key);
  });

  const answerRows = answers.map((answer) => ({
    question_id: answer.questionId,
    selected_choice: answer.selectedChoice,
    is_correct: correctMap.get(answer.questionId) === answer.selectedChoice
  }));

  const correctCount = answerRows.filter((answer) => answer.is_correct).length;
  const totalItems = answerRows.length;
  const score = totalItems > 0 ? Math.round((correctCount / totalItems) * 10000) / 100 : 0;

  const { data: attempt, error: attemptError } = await supabase
    .from("exam_attempts")
    .insert({
      student_id: studentId,
      mock_exam_id: mockExamId,
      score,
      total_items: totalItems,
      correct_count: correctCount,
      started_at: new Date().toISOString(),
      submitted_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (attemptError || !attempt) throw attemptError ?? new Error("Failed to create exam attempt.");

  const { error: answersError } = await supabase.from("exam_answers").insert(
    answerRows.map((answer) => ({
      attempt_id: attempt.id,
      question_id: answer.question_id,
      selected_choice: answer.selected_choice,
      is_correct: answer.is_correct
    }))
  );

  if (answersError) throw answersError;
  return attempt.id as string;
}

export async function getAttemptResult(
  supabase: ServerClient,
  attemptId: string,
  studentId: string
): Promise<AttemptResult | null> {
  const { data: attempt, error: attemptError } = await supabase
    .from("exam_attempts")
    .select("id, score, total_items, correct_count")
    .eq("id", attemptId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (attemptError) throw attemptError;
  if (!attempt) return null;

  const { data: answers, error: answersError } = await supabase
    .from("exam_answers")
    .select(
      "selected_choice, is_correct, exam_questions(id, question_text, explanation, subjects(name), topics(name), exam_choices(choice_key, choice_text, is_correct))"
    )
    .eq("attempt_id", attemptId);

  if (answersError) throw answersError;

  const items = (answers ?? []).map((answer: any) => {
    const question = answer.exam_questions;
    const choices = (question?.exam_choices ?? [])
      .map((choice: any) => ({
        choice_key: choice.choice_key,
        choice_text: choice.choice_text,
        is_correct: choice.is_correct
      }))
      .sort((a: any, b: any) => a.choice_key.localeCompare(b.choice_key));

    const correctChoice = choices.find((choice: any) => choice.is_correct)?.choice_key ?? "A";

    return {
      questionId: question?.id ?? "",
      questionText: question?.question_text ?? "",
      explanation: question?.explanation ?? "",
      topic: question?.topics?.name ?? "Unassigned Topic",
      subject: question?.subjects?.name ?? "Unassigned Subject",
      selectedChoice: answer.selected_choice,
      correctChoice,
      isCorrect: answer.is_correct,
      choices
    };
  });

  const weakTopics = Array.from(new Set(items.filter((item) => !item.isCorrect).map((item) => item.topic)));

  return {
    id: attempt.id,
    score: Number(attempt.score ?? 0),
    totalItems: attempt.total_items ?? items.length,
    correctCount: attempt.correct_count ?? items.filter((item) => item.isCorrect).length,
    weakTopics,
    items
  };
}
