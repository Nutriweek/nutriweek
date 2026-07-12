import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6" aria-label="Login">
      <AuthCard
        title="Welcome Back"
        subtitle="Login to continue using Nutriweek"
      >
        <LoginForm />
      </AuthCard>
    </main>
  );
}
