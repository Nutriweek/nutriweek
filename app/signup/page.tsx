import AuthCard from "@/components/auth/AuthCard";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6" aria-label="Create account">
      <AuthCard title="Create your account" subtitle="Start planning healthier weeks with Nutriweek">
        <SignupForm />
      </AuthCard>
    </main>
  );
}
