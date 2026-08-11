"use client";

import { LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";

import { placeCheckoutSessionOrder } from "@/lib/grocery/checkoutSessions";

export default function PlaceOrderForm({ sessionId }: { sessionId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await placeCheckoutSessionOrder(formData);
      setMessage(result.message);
    });
  }

  return <form action={submit} className="w-full sm:w-auto"><input type="hidden" name="session" value={sessionId} /><button type="submit" disabled={isPending} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60">{isPending ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />Checking order......€¦</> : "Place Order"}</button>{message ? <p className="mt-3 max-w-sm text-sm text-amber-200" role="alert">{message}</p> : null}</form>;
}

