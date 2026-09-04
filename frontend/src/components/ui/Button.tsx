import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "light" | "white";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white shadow-sm hover:bg-accent-hover hover:shadow",
  secondary: "bg-ink/5 text-ink hover:bg-ink/10",
  ghost: "text-ink-tertiary hover:bg-ink/5 hover:text-ink",
  danger: "bg-danger text-white hover:opacity-90",
  /* On-canvas variants — sit on the orange environment, not on a white card */
  light: "bg-white/20 text-white hover:bg-white/30",
  white: "bg-white text-accent-deep shadow-md hover:bg-accent-soft",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

/** The single button used across the app — variants map to the design tokens. */
export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-row font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}