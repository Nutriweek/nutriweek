"use client";

import { CheckCircle2, ClipboardList, Plus, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { createEventGroceryList, deleteEventGroceryList } from "@/lib/event-grocery/actions";

type EventGroceryList = { id: string; name: string; itemCount: number; updatedAt: string; purchasedAt: string | null };

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

export default function EventGroceryListIndex({ lists }: { lists: EventGroceryList[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [listPendingDeletion, setListPendingDeletion] = useState<EventGroceryList | null>(null);
  const [isPending, startTransition] = useTransition();

  function createList() {
    startTransition(async () => {
      const result = await createEventGroceryList(name);
      setMessage({ type: result.success ? "success" : "error", text: result.message });
      if (result.success && result.listId) router.push(`/dashboard/event-grocery/${result.listId}`);
    });
  }

  function deleteList() {
    if (!listPendingDeletion) return;
    startTransition(async () => {
      const result = await deleteEventGroceryList(listPendingDeletion.id);
      setMessage({ type: result.success ? "success" : "error", text: result.message });
      if (result.success) {
        setListPendingDeletion(null);
        router.refresh();
      }
    });
  }

  return <div className="space-y-6">
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="create-event-list-heading">
      <div className="mb-5 flex items-start gap-3"><div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-300"><Plus className="h-5 w-5" aria-hidden="true" /></div><div><h2 id="create-event-list-heading" className="text-xl font-semibold text-white">Create Grocery List</h2><p className="mt-1 text-sm text-zinc-400">Start with a name, then add exactly what the occasion needs.</p></div></div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") createList(); }} placeholder="e.g. Sister's Wedding" maxLength={120} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-emerald-400" aria-label="Grocery list name" /><button type="button" onClick={createList} disabled={isPending || !name.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"><Plus className="h-5 w-5" aria-hidden="true" />Create Grocery List</button></div>
      {message ? <p className={`mt-4 flex items-center gap-2 text-sm ${message.type === "success" ? "text-emerald-300" : "text-rose-300"}`} role={message.type === "error" ? "alert" : "status"}>{message.type === "success" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : null}{message.text}</p> : null}
    </section>

    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="event-lists-heading"><div className="flex items-center gap-3"><div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-200"><ClipboardList className="h-5 w-5" aria-hidden="true" /></div><div><h2 id="event-lists-heading" className="text-xl font-semibold text-white">Your Event Grocery Lists</h2><p className="mt-1 text-sm text-zinc-400">Keep every occasion organized in one place.</p></div></div>
      {lists.length === 0 ? <p className="mt-6 rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-zinc-500">No event grocery lists yet. Create one to get started.</p> : <ul className="mt-5 divide-y divide-white/[0.08]">{lists.map((list) => <li key={list.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-white">{list.name}</p>{list.purchasedAt ? <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">Purchased</span> : null}</div><p className="mt-1 text-sm text-zinc-500">{list.itemCount} item{list.itemCount === 1 ? "" : "s"} · {list.purchasedAt ? `Purchased ${formatDate(list.purchasedAt)}` : `Updated ${formatDate(list.updatedAt)}`}</p></div><div className="flex flex-wrap gap-2"><Link href={`/dashboard/event-grocery/${list.id}`} className="inline-flex items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/[0.08] px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/[0.14]">{list.purchasedAt ? "View List" : "Open / Edit"}</Link><button type="button" onClick={() => setListPendingDeletion(list)} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"><Trash2 className="h-4 w-4" aria-hidden="true" />Delete</button></div></li>)}</ul>}
    </section>

    <ConfirmationModal open={Boolean(listPendingDeletion)} title="Delete event grocery list?" description="This permanently deletes the list and all of its grocery items." icon={<TriangleAlert className="h-5 w-5" aria-hidden="true" />} confirmText="Delete List" cancelText="Cancel" destructive loading={isPending} onConfirm={deleteList} onCancel={() => { if (!isPending) setListPendingDeletion(null); }}><p className="rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-4 py-3 text-sm text-rose-100">Deleting <strong>{listPendingDeletion?.name}</strong> cannot be undone.</p></ConfirmationModal>
  </div>;
}
