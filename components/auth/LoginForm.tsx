"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { login, loginSchema, type LoginInput } from "@/lib/auth";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setSubmitMessage(null);
    const result = await login(values);
    setSubmitMessage({ type: result.success ? "success" : "error", text: result.message });
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-2 block text-sm font-medium text-white" htmlFor="login-email">
          Email
        </label>
        <input
          {...register("email")}
          id="login-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:border-emerald-400 focus:outline-none"
        />
        {errors.email && <p id="login-email-error" className="mt-2 text-sm text-rose-400" role="alert">{errors.email.message}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-white" htmlFor="login-password">
          Password
        </label>
        <div className="relative">
          <input
            {...register("password")}
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            placeholder="Enter your password"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white placeholder:text-gray-500 focus:border-emerald-400 focus:outline-none"
          />
          <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 transition hover:text-white focus:outline-none">
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <p id="login-password-error" className="mt-2 text-sm text-rose-400" role="alert">{errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-gray-400">
          <input type="checkbox" name="remember" />
          Remember me
        </label>
        <Link href="#" className="text-emerald-400 hover:text-emerald-300">Forgot Password?</Link>
      </div>

      <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100">
        {isSubmitting && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
        {isSubmitting ? "Signing in..." : "Login"}
      </button>

      <button type="button" disabled aria-disabled="true" className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 py-3 text-white opacity-50">Continue with Google</button>

      {submitMessage && <p className={`text-center text-sm ${submitMessage.type === "success" ? "text-emerald-400" : "text-rose-400"}`} role={submitMessage.type === "error" ? "alert" : "status"} aria-live="polite">{submitMessage.text}</p>}

      <p className="text-center text-gray-400">Don&apos;t have an account?{" "}<Link href="/signup" className="text-emerald-400 hover:text-emerald-300">Sign Up</Link></p>
    </form>
  );
}
