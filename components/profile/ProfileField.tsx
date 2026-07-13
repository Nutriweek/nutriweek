import type { ReactNode } from "react";

type ProfileFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
};

export default function ProfileField({ label, htmlFor, error, children }: ProfileFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <p className="mt-2 text-sm text-rose-400" id={`${htmlFor}-error`} role="alert">{error}</p> : null}
    </div>
  );
}
