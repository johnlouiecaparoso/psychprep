import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMockExamQuestions } from "@/lib/supabase/review-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const questions = await getMockExamQuestions(supabase, id);

    if (questions.length === 0) {
      return NextResponse.json({ error: "Study pack not found." }, { status: 404 });
    }

    return NextResponse.json({
      examId: id,
      title: `${questions[0].subject} reviewer set`,
      subject: questions[0].subject,
      questions
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load offline study pack." },
      { status: 500 }
    );
  }
}
