"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container-shell flex min-h-screen items-center justify-center py-10">
      <div className="max-w-md rounded-2xl border bg-card p-6 text-card-foreground shadow-soft">
        <h2 className="text-2xl font-semibold">{isOffline ? "You are offline" : "Something went wrong"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isOffline
            ? "Your internet connection is unavailable. You can still open cached pages in offline mode."
            : "The app hit an unexpected error. Try reloading this view."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={reset}>Try again</Button>
          {isOffline ? (
            <Button variant="outline" onClick={() => window.location.assign("/offline")}>
              Open offline mode
            </Button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
