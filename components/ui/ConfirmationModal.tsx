"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type KeyboardEvent, type ReactNode, useEffect, useRef } from "react";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  confirmText: string;
  cancelText: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export default function ConfirmationModal({
  open,
  title,
  description,
  icon,
  children,
  confirmText,
  cancelText,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousActiveElement?.focus();
    };
  }, [onCancel, open]);

  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !dialogRef.current) return;

    const focusableElements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return <AnimatePresence>
    {open ? <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onMouseDown={onCancel}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        aria-describedby={description ? "confirmation-modal-description" : undefined}
        className="w-full max-w-lg rounded-3xl border border-white/[0.08] bg-zinc-950 p-5 text-left shadow-2xl shadow-black/50 outline-none sm:p-6"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onKeyDown={trapFocus}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex gap-4">
          {icon ? <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10 text-lg text-amber-200 shadow-lg shadow-amber-950/20">{icon}</div> : null}
          <div className="min-w-0 flex-1">
            <h2 id="confirmation-modal-title" className="text-xl font-semibold tracking-tight text-white">{title}</h2>
            {description ? <p id="confirmation-modal-description" className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p> : null}
          </div>
        </div>

        {children ? <div className="mt-5">{children}</div> : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={`inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${destructive ? "bg-emerald-400 text-zinc-950 hover:bg-emerald-300 focus:ring-emerald-400/40" : "border border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] focus:ring-emerald-400/40"}`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${destructive ? "border border-rose-400/40 bg-rose-500/10 text-rose-200 hover:border-rose-300/60 hover:bg-rose-500/15 focus:ring-rose-300/40" : "bg-emerald-400 text-zinc-950 hover:bg-emerald-300 focus:ring-emerald-400/40"}`}
          >
            {loading ? "Working..." : confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div> : null}
  </AnimatePresence>;
}
