import type { ReactNode } from "react";

type ProfileSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function ProfileSection({ title, description, children }: ProfileSectionProps) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 sm:p-7">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>
      {children}
    </section>
  );
}
