"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { createCustomerDeliveryOtp, replaceExpiredCustomerDeliveryOtp } from "@/lib/local-store/delivery";

type StoredOtp = { otp: string; expiresAt: string };

function storageKey(orderId: string) {
  return `nutriweek:delivery-otp:${orderId}`;
}

export default function CustomerDeliveryOtp({ orderId }: { orderId: string }) {
  const [otp, setOtp] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveCode = useCallback((nextOtp: string, nextExpiresAt: string) => {
    sessionStorage.setItem(storageKey(orderId), JSON.stringify({ otp: nextOtp, expiresAt: nextExpiresAt } satisfies StoredOtp));
    setOtp(nextOtp);
    setExpiresAt(nextExpiresAt);
    setExpired(false);
  }, [orderId]);

  const loadCode = useCallback(() => {
    setMessage(null);
    startTransition(async () => {
      const result = await createCustomerDeliveryOtp(orderId);
      if (!result.success) {
        setMessage(result.message);
        return;
      }
      if (result.state === "generated" && result.otp && result.expiresAt) {
        saveCode(result.otp, result.expiresAt);
        return;
      }
      if (result.state === "expired") {
        sessionStorage.removeItem(storageKey(orderId));
        setOtp(null);
        setExpiresAt(result.expiresAt);
        setExpired(true);
        return;
      }
      const stored = sessionStorage.getItem(storageKey(orderId));
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as StoredOtp;
          if (/^\d{6}$/.test(parsed.otp) && new Date(parsed.expiresAt).getTime() > Date.now()) {
            setOtp(parsed.otp);
            setExpiresAt(parsed.expiresAt);
            return;
          }
        } catch {
          // Invalid browser cache is treated as unavailable, never trusted for verification.
        }
      }
      setExpiresAt(result.expiresAt);
      setMessage("Your delivery code was generated in another session. It remains valid until it expires.");
    });
  }, [orderId, saveCode]);

  function replaceCode() {
    setMessage(null);
    startTransition(async () => {
      const result = await replaceExpiredCustomerDeliveryOtp(orderId);
      if (!result.success || !result.otp || !result.expiresAt) {
        setMessage(result.success ? "Your delivery code is still valid." : result.message);
        return;
      }
      saveCode(result.otp, result.expiresAt);
    });
  }

  useEffect(() => {
    const timer = window.setTimeout(loadCode, 0);
    return () => window.clearTimeout(timer);
  }, [loadCode]);

  useEffect(() => {
    if (!expiresAt) return;
    const delay = new Date(expiresAt).getTime() - Date.now();
    if (delay <= 0) {
      const timer = window.setTimeout(() => {
        setOtp(null);
        setExpired(true);
        sessionStorage.removeItem(storageKey(orderId));
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      setOtp(null);
      setExpired(true);
      sessionStorage.removeItem(storageKey(orderId));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [expiresAt, orderId]);

  return <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.08] p-5 sm:p-7" aria-labelledby="customer-delivery-code-heading"><h2 id="customer-delivery-code-heading" className="text-lg font-semibold text-white">Your delivery code</h2><p className="mt-2 text-sm leading-relaxed text-zinc-300">At handoff, tell this code to the delivery partner. Do not share it before you have received and checked your groceries.</p>{otp ? <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-black/20 p-5 text-center"><p className="text-3xl font-semibold tracking-[0.3em] text-white">{otp}</p><p className="mt-2 text-xs text-zinc-400">Expires {expiresAt ? new Date(expiresAt).toLocaleTimeString() : "soon"}</p></div> : expired ? <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/[0.06] p-5"><p className="font-medium text-amber-100">Your delivery code has expired.</p><button type="button" onClick={replaceCode} disabled={isPending} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">{isPending ? "Generating new code…" : "Generate new delivery code"}</button></div> : <p className="mt-5 text-sm text-zinc-400">{isPending ? "Preparing your delivery code…" : "Preparing your delivery code…"}</p>}{message ? <p role="alert" className="mt-3 text-sm text-amber-200">{message}</p> : null}</section>;
}
