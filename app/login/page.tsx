import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const nextPath = Array.isArray(next) ? next[0] : next;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6" aria-label="Login">
      <AuthCard
        title="Welcome Back"
        subtitle="Login to continue using Nutriweek"
      >
        <LoginForm nextPath={nextPath} />
      </AuthCard>
    </main>
  );
}
