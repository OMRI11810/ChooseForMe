import type { ReactNode } from "react";

interface ChipProps {
  tone?: "neutral" | "success" | "accent" | "light";
  children: ReactNode;
}

const TONES = {
  neutral: "bg-ink/5 text-ink-secondary",
  success: "bg-success-soft text-success",
  accent: "bg-accent-soft text-accent-deep",
  /* On-canvas chip (sits on the orange environment) */
  light: "bg-white/20 text-white",
} as const;

/** Small status pill (e.g. Open / Decided). */
export default function Chip({ tone = "neutral", children }: ChipProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}