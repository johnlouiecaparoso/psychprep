import Link from "next/link";
import { Shuffle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getMockExamSummaries } from "@/lib/supabase/review-service";
import { cn } from "@/lib/utils";

export default async function MockExamsPage() {
  const supabase = await createClient();
  const exams = await getMockExamSummaries(supabase);

  return (
    <AppShell
      role="student"
      title="Mock exams"
      description="Choose a full exam or launch a shuffled run so you practice understanding instead of memorizing order."
    >
      {exams.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="font-semibold">No mock exams available yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask an instructor or admin to upload a CSV first so exams can appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam) => {
            const shuffleHref = `/student/mock-exams/${exam.id}?shuffle=1&seed=${Date.now().toString()}${exam.id}`;
            return (
              <Card key={exam.id}>
                <CardHeader>
                  <CardTitle>{exam.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{exam.subject}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{exam.questionCount} questions</span>
                    <span>{exam.topicCount} topics</span>
                  </div>
                  <div className="grid gap-3">
                    <Link href={`/student/mock-exams/${exam.id}`} className={cn(buttonVariants(), "w-full")}>
                      Start exam
                    </Link>
                    <Link href={shuffleHref as any} className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2")}>
                      <Shuffle className="h-4 w-4" />
                      Shuffle exam order
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </AppShell>
  );
}

