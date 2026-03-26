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
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container-shell flex min-h-screen items-center justify-center py-10">
      <div className="max-w-md rounded-2xl border bg-card p-6 text-card-foreground shadow-soft">
        <h2 className="text-2xl font-semibold">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The app hit an unexpected error. Try reloading this view.
        </p>
        <Button className="mt-4" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
