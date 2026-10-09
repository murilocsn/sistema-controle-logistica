import type { ReactNode } from "react";

export const inputClassName =
  "mt-1 h-10 w-full rounded border border-graphite-100 bg-white px-3 text-sm text-graphite-900 outline-none transition focus:border-signal-500 focus:ring-2 focus:ring-signal-500/20";

export const textareaClassName =
  "mt-1 min-h-20 w-full rounded border border-graphite-100 bg-white px-3 py-2 text-sm text-graphite-900 outline-none transition focus:border-signal-500 focus:ring-2 focus:ring-signal-500/20";

type FormFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-graphite-800">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-700">{error}</span> : null}
    </label>
  );
}
