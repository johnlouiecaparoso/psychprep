"use client";

import Link from "next/link";
import { WifiOff } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function OfflinePage() {
  return (
    <main className="container-shell flex min-h-screen items-center justify-center py-10">
      <Card className="w-full max-w-xl rounded-[32px] border bg-white/90 shadow-soft backdrop-blur dark:bg-card/90">
        <CardContent className="space-y-6 p-8 text-center sm:p-10">
          <div className="mx-auto inline-flex rounded-full bg-secondary p-4 text-secondary-foreground">
            <WifiOff className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">You are offline</h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              PsychBoard can still open cached pages, but live dashboards, uploads, and fresh exam data need an internet connection.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className={buttonVariants()}>
              Back to home
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
