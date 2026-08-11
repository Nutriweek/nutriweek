"use client";

import { LoaderCircle, MapPin, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { createCustomerAddress, type CustomerAddress } from "@/lib/local-store/customerAddresses";
import { startLocalStoreProcessingFeePayment, verifyLocalStoreProcessingFeePayment } from "@/lib/local-store/actions";
import { ORDER_PROCESSING_FEE_CURRENCY, ORDER_PROCESSING_FEE_PAISE } from "@/lib/local-store/constants";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

type RazorpaySuccess = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; contact?: string };
  handler: (response: RazorpaySuccess) => void;
  modal: { ondismiss: () => void };
};
type AddressDraft = { label: string; recipientName: string; phone: string; line1: string; line2: string; landmark: string; city: string; stateProvince: string; postalCode: string; latitude: string; longitude: string };

const emptyAddress: AddressDraft = { label: "Home", recipientName: "", phone: "", line1: "", line2: "", landmark: "", city: "", stateProvince: "", postalCode: "", latitude: "", longitude: "" };

let checkoutScriptPromise: Promise<void> | null = null;

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScriptPromise) return checkoutScriptPromise;
  checkoutScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load secure payment checkout. Please try again."));
    document.body.appendChild(script);
  });
  return checkoutScriptPromise;
}

export default function PlaceOrderForm({ sessionId, initialAddresses }: { sessionId: string; initialAddresses: CustomerAddress[] }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(initialAddresses.find((address) => address.isDefault)?.id ?? initialAddresses[0]?.id ?? "");
  const [showAddressForm, setShowAddressForm] = useState(initialAddresses.length === 0);
  const [addressDraft, setAddressDraft] = useState<AddressDraft>(emptyAddress);
  const [message, setMessage] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const paymentInFlight = useRef(false);

  const selectedAddress = addresses.find((address) => address.id === selectedAddressId);
  const isBusy = isSavingAddress || isStartingPayment || isVerifyingPayment;

  function updateDraft(field: keyof AddressDraft, value: string) {
    setAddressDraft((current) => ({ ...current, [field]: value }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage("This browser cannot provide your location. Enter latitude and longitude manually.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateDraft("latitude", String(position.coords.latitude));
        updateDraft("longitude", String(position.coords.longitude));
      },
      () => setMessage("We could not get your location. Enter latitude and longitude manually."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function saveAddress() {
    const latitude = Number(addressDraft.latitude);
    const longitude = Number(addressDraft.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setMessage("Use your current location or enter valid latitude and longitude.");
      return;
    }
    setMessage(null);
    setIsSavingAddress(true);
    const result = await createCustomerAddress({ ...addressDraft, latitude, longitude });
    setIsSavingAddress(false);
    if (!result.success) {
      setMessage(result.message);
      return;
    }
    setAddresses((current) => [...current, result.address]);
    setSelectedAddressId(result.address.id);
    setShowAddressForm(false);
    setAddressDraft(emptyAddress);
  }

  async function pay() {
    if (!selectedAddress || isBusy || paymentInFlight.current) {
      setMessage("Select a delivery address before paying the processing fee.");
      return;
    }
    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKey?.startsWith("rzp_test_")) {
      setMessage("Test payment is not configured yet. Please try again later.");
      return;
    }
    setMessage(null);
    paymentInFlight.current = true;
    setIsStartingPayment(true);
    try {
      const result = await startLocalStoreProcessingFeePayment(sessionId, selectedAddress.id);
      if (!result.success) {
        setMessage(result.message);
        paymentInFlight.current = false;
        setIsStartingPayment(false);
        return;
      }
      if (result.amountPaise !== ORDER_PROCESSING_FEE_PAISE || result.currency !== ORDER_PROCESSING_FEE_CURRENCY) {
        setMessage("The processing-fee amount could not be verified. Please try again.");
        paymentInFlight.current = false;
        setIsStartingPayment(false);
        return;
      }
      await loadRazorpayCheckout();
      if (!window.Razorpay) throw new Error("Secure payment checkout is unavailable. Please try again.");
      const checkout = new window.Razorpay({
        key: razorpayKey,
        amount: result.amountPaise,
        currency: result.currency,
        name: "Nutriweek",
        description: "Order Processing Fee",
        order_id: result.razorpayOrderId,
        prefill: { name: selectedAddress.recipientName, contact: selectedAddress.phone },
        modal: { ondismiss: () => { paymentInFlight.current = false; setIsStartingPayment(false); setMessage("Payment was not completed. Your grocery basket is unchanged and you can try again."); } },
        handler: async (response) => {
          setIsVerifyingPayment(true);
          const verification = await verifyLocalStoreProcessingFeePayment({
            localStoreOrderId: result.localStoreOrderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });
          setIsVerifyingPayment(false);
          paymentInFlight.current = false;
          setIsStartingPayment(false);
          if (!verification.success) {
            setMessage(verification.message);
            return;
          }
          router.push(`/dashboard/grocery/order-processing?order=${encodeURIComponent(result.localStoreOrderId)}`);
        },
      });
      checkout.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start payment. Please try again.");
      paymentInFlight.current = false;
      setIsStartingPayment(false);
    }
  }

  return <div className="w-full space-y-4"><section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7" aria-labelledby="delivery-address-heading"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="delivery-address-heading" className="text-lg font-semibold text-white">Delivery address</h2><p className="mt-1 text-sm text-zinc-400">A nearby Local Store will use this address after it accepts your order.</p></div><button type="button" onClick={() => setShowAddressForm((current) => !current)} disabled={isBusy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.08] disabled:opacity-60"><Plus className="h-4 w-4" aria-hidden="true" />Add address</button></div>{addresses.length ? <div className="mt-5 space-y-3">{addresses.map((address) => <label key={address.id} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${selectedAddressId === address.id ? "border-emerald-400/50 bg-emerald-500/[0.08]" : "border-white/[0.08] bg-black/10"}`}><input type="radio" name="delivery-address" value={address.id} checked={selectedAddressId === address.id} onChange={() => setSelectedAddressId(address.id)} disabled={isBusy} className="mt-1 accent-emerald-400" /><span><span className="flex flex-wrap items-center gap-2 font-medium text-white">{address.label}{address.isDefault ? <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs text-emerald-200">Default</span> : null}</span><span className="mt-1 block text-sm text-zinc-300">{address.recipientName} · {address.phone}</span><span className="mt-1 block text-sm text-zinc-500">{address.summary}</span></span></label>)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-zinc-400">Add a delivery address to continue to payment.</p>}{showAddressForm ? <div className="mt-5 grid gap-3 rounded-2xl border border-white/[0.08] bg-black/10 p-4 sm:grid-cols-2"><input value={addressDraft.label} onChange={(event) => updateDraft("label", event.target.value)} placeholder="Label (e.g. Home)" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white placeholder:text-zinc-500" /><input value={addressDraft.recipientName} onChange={(event) => updateDraft("recipientName", event.target.value)} placeholder="Recipient name" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white placeholder:text-zinc-500" /><input value={addressDraft.phone} onChange={(event) => updateDraft("phone", event.target.value)} placeholder="Phone number" inputMode="tel" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white placeholder:text-zinc-500" /><input value={addressDraft.line1} onChange={(event) => updateDraft("line1", event.target.value)} placeholder="Address line 1" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white placeholder:text-zinc-500" /><input value={addressDraft.line2} onChange={(event) => updateDraft("line2", event.target.value)} placeholder="Address line 2 (optional)" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white placeholder:text-zinc-500" /><input value={addressDraft.landmark} onChange={(event) => updateDraft("landmark", event.target.value)} placeholder="Landmark (optional)" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white placeholder:text-zinc-500" /><input value={addressDraft.city} onChange={(event) => updateDraft("city", event.target.value)} placeholder="City" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white placeholder:text-zinc-500" /><input value={addressDraft.stateProvince} onChange={(event) => updateDraft("stateProvince", event.target.value)} placeholder="State / Province" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white placeholder:text-zinc-500" /><input value={addressDraft.postalCode} onChange={(event) => updateDraft("postalCode", event.target.value)} placeholder="Postal code" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white placeholder:text-zinc-500" /><div className="flex gap-2"><input value={addressDraft.latitude} onChange={(event) => updateDraft("latitude", event.target.value)} placeholder="Latitude" inputMode="decimal" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white placeholder:text-zinc-500" /><input value={addressDraft.longitude} onChange={(event) => updateDraft("longitude", event.target.value)} placeholder="Longitude" inputMode="decimal" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white placeholder:text-zinc-500" /></div><div className="sm:col-span-2 flex flex-wrap gap-2"><button type="button" onClick={useCurrentLocation} disabled={isBusy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/[0.08]"><MapPin className="h-4 w-4" aria-hidden="true" />Use current location</button><button type="button" onClick={saveAddress} disabled={isBusy} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-60">{isSavingAddress ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}Save address</button></div></div> : null}</section><section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.06] p-5 sm:p-7" aria-labelledby="payment-heading"><h2 id="payment-heading" className="text-lg font-semibold text-white">₹100 booking / processing fee</h2><p className="mt-2 text-sm leading-relaxed text-zinc-300">The grocery amount is paid directly to the local store on delivery.</p><p className="mt-2 text-sm leading-relaxed text-zinc-400">The ₹100 fee is non-refundable after the order is successfully submitted, except where Nutriweek or store fulfillment fails and a refund is approved.</p><button type="button" onClick={pay} disabled={!selectedAddress || isBusy} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">{isStartingPayment || isVerifyingPayment ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />{isVerifyingPayment ? "Verifying payment…" : "Opening secure payment…"}</> : "Pay ₹100 & Place Order"}</button>{message ? <p className="mt-3 text-sm text-amber-100" role="alert">{message}</p> : null}</section></div>;
}
