"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { confirmLocalStoreDelivery } from "@/lib/local-store/delivery";

export default function DeliveryConfirmationForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmDelivery() {
    setMessage(null);
    startTransition(async () => {
      const result = await confirmLocalStoreDelivery(orderId, otp);
      if (!result.success) {
        setMessage(result.message);
        return;
      }
      router.push(`/dashboard/grocery/order-confirmation?session=${encodeURIComponent(result.checkoutSessionId)}`);
    });
  }

  return <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.08] p-5 text-left sm:p-7" aria-labelledby="delivery-code-heading"><h2 id="delivery-code-heading" className="text-lg font-semibold text-white">Confirm delivery</h2><p className="mt-2 text-sm leading-relaxed text-zinc-300">Enter the six-digit code provided to you at delivery. This confirms receipt only; you pay the grocery amount directly to the store.</p><label className="mt-5 block text-sm font-medium text-zinc-200" htmlFor="delivery-otp">Delivery code</label><input id="delivery-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-center text-lg tracking-[0.35em] text-white outline-none transition focus:border-emerald-300" placeholder="000000" /><button type="button" onClick={confirmDelivery} disabled={isPending || otp.length !== 6} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">{isPending ? "Confirming…" : "Confirm receipt"}</button>{message ? <p role="alert" className="mt-3 text-sm text-amber-200">{message}</p> : null}</section>;
}
