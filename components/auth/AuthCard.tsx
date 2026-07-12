import { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthCard({
  title,
  subtitle,
  children,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">
          {title}
        </h1>

        <p className="mt-2 text-gray-400">
          {subtitle}
        </p>
      </div>

      {children}
    </div>
  );
}