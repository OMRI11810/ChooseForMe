import type { ButtonHTMLAttributes } from "react";

type Tone = "default" | "danger" | "accent" | "light";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name / tooltip for the icon. */
  label: string;
  tone?: Tone;
}

const TONES: Record<Tone, string> = {
  default: "text-ink-tertiary hover:bg-ink/5 hover:text-ink",
  danger: "text-ink-tertiary hover:bg-danger/10 hover:text-danger",
  accent: "text-accent-deep hover:bg-accent-soft",
  /* On-canvas icon button (sits on the orange environment) */
  light: "text-white/80 hover:bg-white/15 hover:text-white",
};

/** Small circular ghost button used for icon-only actions (edit, delete, …). */
export default function IconButton({
  label,
  tone = "default",
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-30 ${TONES[tone]} ${className}`}
      {...props}
    />
  );
}