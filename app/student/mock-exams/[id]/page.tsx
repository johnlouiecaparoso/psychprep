import { AppShell } from "@/components/app-shell";
import { MockExamClient } from "@/components/exam/mock-exam-client";
import { sampleQuestions } from "@/lib/mock-data";

export default async function StudentMockExamPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell
      role="student"
      title="Timed mock exam"
      description="Take one question at a time, use the palette to jump, and submit when you're ready."
    >
      <MockExamClient examId={id} questions={sampleQuestions} />
    </AppShell>
  );
}
