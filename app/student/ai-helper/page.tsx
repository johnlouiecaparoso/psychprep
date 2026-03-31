import { AppShell } from "@/components/app-shell";
import { GeminiHelper } from "@/components/reviewers/gemini-helper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentAiHelperPage() {
  return (
    <AppShell
      role="student"
      title="AI helper"
      description="Ask Gemini for explanations, summaries, and review guidance by subject."
    >
      <Card className="overflow-hidden h-[calc(100dvh-9rem)] sm:h-[calc(100dvh-10rem)] md:h-[calc(100dvh-11rem)] lg:h-[calc(100vh-11.5rem)]">
        <CardHeader className="px-4 pb-2 pt-4 sm:px-6 sm:pb-3 sm:pt-5">
          <CardTitle className="text-base sm:text-lg">Gemini study helper</CardTitle>
        </CardHeader>
        <CardContent className="h-full min-h-0 px-4 pb-[env(safe-area-inset-bottom)] pt-0 sm:px-6 sm:pb-4">
          <GeminiHelper />
        </CardContent>
      </Card>
    </AppShell>
  );
}
