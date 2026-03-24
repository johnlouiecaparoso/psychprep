import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitMockExamAttempt } from "@/lib/supabase/review-service";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      mockExamId: string;
      answers: { questionId: string; selectedChoice: "A" | "B" | "C" | "D" }[];
    };

    if (!body.mockExamId || body.answers.length === 0) {
      return NextResponse.json({ error: "Exam answers are required." }, { status: 400 });
    }

    const attemptId = await submitMockExamAttempt({
      supabase,
      studentId: user.id,
      mockExamId: body.mockExamId,
      answers: body.answers
    });

    return NextResponse.json({ attemptId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit exam." },
      { status: 500 }
    );
  }
}
