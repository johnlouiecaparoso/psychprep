import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMockExamQuestions } from "@/lib/supabase/review-service";
import { inferChapterLabel } from "@/lib/review-content";

export async function GET(
  request: Request,
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
    const url = new URL(request.url);
    const chapter = url.searchParams.get("chapter");
    const questions = (await getMockExamQuestions(supabase, id)).filter((question) =>
      chapter ? inferChapterLabel(question.topic) === chapter : true
    );

    if (questions.length === 0) {
      return NextResponse.json({ error: "Study pack not found." }, { status: 404 });
    }

    return NextResponse.json({
      examId: chapter ? `${id}::${chapter}` : id,
      sourceExamId: id,
      title: `${questions[0].subject} reviewer set`,
      subject: questions[0].subject,
      chapter: chapter ?? null,
      questions
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load offline study pack." },
      { status: 500 }
    );
  }
}
