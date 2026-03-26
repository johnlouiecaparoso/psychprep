export default function Loading() {
  return (
    <main className="container-shell flex min-h-screen items-center justify-center py-10">
      <div className="rounded-2xl border bg-card px-6 py-4 text-card-foreground shadow-soft">
        <p className="text-sm text-muted-foreground">Loading reviewer workspace...</p>
      </div>
    </main>
  );
}
