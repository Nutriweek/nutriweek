"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updatePreferredShoppingProvider } from "@/lib/shopping-providers/actions";
import { SHOPPING_PROVIDER_STATUS } from "@/lib/shopping-providers/constants";
import type { ShoppingProvider, ShoppingProviderId } from "@/lib/shopping-providers/types";

export default function ShoppingProviderSelector({ providers, preferredProviderId }: { providers: ShoppingProvider[]; preferredProviderId: ShoppingProviderId }) {
  const [selectedProviderId, setSelectedProviderId] = useState(preferredProviderId);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function selectProvider(providerId: string) {
    if (providerId === selectedProviderId) return;
    setIsSaving(true);
    setMessage(null);
    const result = await updatePreferredShoppingProvider(providerId);
    setIsSaving(false);
    if (!result.success) {
      setMessage(result.message);
      return;
    }
    setSelectedProviderId(providerId);
  }

  return <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="shopping-provider-heading"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="shopping-provider-heading" className="text-lg font-semibold text-white">Shopping provider</h2><p className="mt-1 text-sm text-zinc-400">Choose where you plan to shop for this grocery list.</p></div><div className="w-full sm:max-w-xs"><label htmlFor="shopping-provider" className="sr-only">Shopping provider</label><Select value={selectedProviderId} onValueChange={selectProvider} disabled={isSaving}><SelectTrigger id="shopping-provider"><SelectValue /></SelectTrigger><SelectContent>{providers.map((provider) => <SelectItem key={provider.id} value={provider.id} disabled={provider.status !== SHOPPING_PROVIDER_STATUS.ACTIVE}>{provider.name}{provider.status === SHOPPING_PROVIDER_STATUS.COMING_SOON ? " (Coming Soon)" : ""}</SelectItem>)}</SelectContent></Select></div></div>{isSaving ? <p className="mt-3 flex items-center gap-2 text-sm text-zinc-400" role="status"><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />Saving shopping provider...</p> : null}{message ? <p className="mt-3 text-sm text-rose-300" role="alert">{message}</p> : null}</section>;
}
