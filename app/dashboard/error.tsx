"use client";

import { RefreshCw } from "lucide-react";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <section className="flex min-h-[50vh] items-center justify-center" aria-labelledby="dashboard-error-heading">
      <div className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-center backdrop-blur-xl">
        <p className="text-sm font-medium uppercase tracking-widest text-rose-400/80">Dashboard unavailable</p>
        <h1 id="dashboard-error-heading" className="mt-4 text-2xl font-semibold text-white">We couldn&apos;t load your dashboard.</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">Please try again. If the problem continues, return to this page later.</p>
        <button type="button" onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    </section>
  );
}
