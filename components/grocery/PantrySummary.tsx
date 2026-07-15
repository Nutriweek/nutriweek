"use client";

import { ChevronDown, Check } from "lucide-react";
import { useState } from "react";

type PantrySummaryProps = {
  items: string[];
};

export default function PantrySummary({ items }: PantrySummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (items.length === 0) return null;

  return <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 sm:p-6" aria-labelledby="pantry-summary-heading">
    <button type="button" onClick={() => setIsExpanded((value) => !value)} className="flex w-full items-center justify-between gap-4 text-left">
      <div>
        <h2 id="pantry-summary-heading" className="font-semibold text-emerald-100">Already in your Kitchen Pantry</h2>
        <p className="mt-1 text-sm text-emerald-100/70">These ingredients have already been removed from your shopping basket.</p>
      </div>
      <ChevronDown className={`h-5 w-5 shrink-0 text-emerald-200 transition ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
    </button>
    {isExpanded ? <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => <li key={item} className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/10 px-3 py-2 text-sm text-emerald-100">
        <Check className="h-4 w-4 text-emerald-300" aria-hidden="true" />
        {item}
      </li>)}
    </ul> : null}
  </section>;
}
