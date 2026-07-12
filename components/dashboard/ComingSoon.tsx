type ComingSoonProps = {
  title: string;
  description: string;
};

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <section className="flex min-h-[50vh] items-center justify-center" aria-labelledby="coming-soon-heading">
      <div className="w-full max-w-xl rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 text-center backdrop-blur-xl sm:p-10">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">Coming soon</p>
        <h1 id="coming-soon-heading" className="mt-4 text-3xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-zinc-400">{description}</p>
      </div>
    </section>
  );
}
