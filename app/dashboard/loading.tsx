export default function DashboardLoading() {
  return (
    <div className="space-y-8" aria-label="Loading dashboard" aria-busy="true">
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-emerald-400/15" />
        <div className="h-10 w-72 max-w-full animate-pulse rounded-xl bg-white/[0.08]" />
        <div className="h-5 w-full max-w-2xl animate-pulse rounded bg-white/[0.06]" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-56 animate-pulse rounded-3xl border border-white/[0.06] bg-white/[0.04]" />
        ))}
      </div>
      <span className="sr-only">Loading dashboard</span>
    </div>
  );
}
