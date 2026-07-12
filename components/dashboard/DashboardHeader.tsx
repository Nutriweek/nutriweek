import SignOutButton from "./SignOutButton";

type DashboardHeaderProps = {
  email?: string;
};

export default function DashboardHeader({ email }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/[0.08] bg-white/[0.02] px-4 py-4 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-white">Your kitchen, organized.</p>
        <p className="mt-1 truncate text-sm text-zinc-500">{email ?? "Email unavailable"}</p>
      </div>
      <SignOutButton />
    </header>
  );
}
