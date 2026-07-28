type CheckoutStepperProps = {
  currentStep: 1 | 2 | 3;
};

const steps = ["Select Store", "Review Order", "Place Order"] as const;

export default function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  return <nav aria-label="Checkout progress" className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 backdrop-blur-xl sm:p-4">
    <ol className="flex items-start">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber <= currentStep;
        const isLastStep = stepNumber === steps.length;

        return <li key={step} className="flex min-w-0 flex-1 items-center last:flex-none">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${isActive ? "border-emerald-300/70 bg-emerald-400 text-emerald-950" : "border-white/10 bg-white/[0.04] text-zinc-500"}`}>{stepNumber}</span>
            <span className={`min-w-0 text-xs font-medium sm:text-sm ${isActive ? "text-emerald-100" : "text-zinc-500"}`}>{step}</span>
          </div>
          {!isLastStep ? <span className={`mx-2 h-px min-w-3 flex-1 sm:mx-4 ${stepNumber < currentStep ? "bg-emerald-400/70" : "bg-white/10"}`} aria-hidden="true" /> : null}
        </li>;
      })}
    </ol>
  </nav>;
}
