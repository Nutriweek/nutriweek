import ProfileForm from "@/components/profile/ProfileForm";
import { getCurrentUserProfile } from "@/lib/profile/queries";

export default async function ProfilePage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    throw new Error("Your profile is not available yet. Please refresh the page and try again.");
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-400/80">Profile</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Make your plan personal</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-zinc-400">Your preferences will shape future weekly meal plans and grocery lists.</p>
      </div>
      <ProfileForm profile={profile} />
    </section>
  );
}
