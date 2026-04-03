export default function AdminLoading() {
  return (
    <main className="container-shell py-6 sm:py-8">
      <div className="grid gap-4 sm:gap-5">
        <div className="h-20 animate-pulse rounded-[22px] border bg-card/70 sm:h-24" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="h-28 animate-pulse rounded-3xl border bg-card/70" />
          <div className="h-28 animate-pulse rounded-3xl border bg-card/70" />
          <div className="h-28 animate-pulse rounded-3xl border bg-card/70" />
          <div className="h-28 animate-pulse rounded-3xl border bg-card/70" />
        </div>
        <div className="h-64 animate-pulse rounded-3xl border bg-card/70" />
      </div>
    </main>
  );
}
