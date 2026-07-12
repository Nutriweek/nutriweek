"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signOut } from "@/lib/auth";

export default function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignOut() {
    setIsPending(true);
    setErrorMessage(null);

    const result = await signOut();

    if (!result.success) {
      setErrorMessage(result.message);
      setIsPending(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        aria-busy={isPending}
        className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
        {isPending ? "Signing out..." : "Sign Out"}
      </button>
      {errorMessage && <p className="text-right text-sm text-rose-400" role="alert">{errorMessage}</p>}
    </div>
  );
}
