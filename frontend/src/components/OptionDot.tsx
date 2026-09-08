const DOT_BG = [
  "bg-dot-blue",
  "bg-dot-green",
  "bg-dot-orange",
  "bg-dot-red",
  "bg-dot-purple",
] as const;

const DOT_TEXT = [
  "text-dot-blue",
  "text-dot-green",
  "text-dot-orange",
  "text-dot-red",
  "text-dot-purple",
] as const;

const DOT_COUNT = DOT_BG.length;

function safeIndex(index: number): number {
  return index >= 0 ? index % DOT_COUNT : 0;
}

/** Deterministic background color class for the nth option in a list. */
export function optionDotClass(index: number): string {
  return DOT_BG[safeIndex(index)];
}

/** Deterministic text color class matching optionDotClass. */
export function optionDotTextClass(index: number): string {
  return DOT_TEXT[safeIndex(index)];
}

const ACCENT_SOFT = [
  "bg-dot-blue/10 text-dot-blue",
  "bg-dot-green/10 text-dot-green",
  "bg-dot-orange/10 text-dot-orange",
  "bg-dot-red/10 text-dot-red",
  "bg-dot-purple/10 text-dot-purple",
] as const;

const ACCENT_HOVER = [
  "hover:border-dot-blue/40",
  "hover:border-dot-green/40",
  "hover:border-dot-orange/40",
  "hover:border-dot-red/40",
  "hover:border-dot-purple/40",
] as const;

const ACCENT_BAR = [
  "bg-dot-blue",
  "bg-dot-green",
  "bg-dot-orange",
  "bg-dot-red",
  "bg-dot-purple",
] as const;

/**
 * Deterministic soft accent (icon + tinted background), matching hover border,
 * and a solid left bar — all cycling through the harmonious dot palette so
 * saved decisions each carry their own color while orange stays the brand.
 */
export function optionAccentClasses(
  index: number,
): { soft: string; hover: string; bar: string } {
  const i = safeIndex(index);
  return { soft: ACCENT_SOFT[i], hover: ACCENT_HOVER[i], bar: ACCENT_BAR[i] };
}

interface OptionDotProps {
  index: number;
  className?: string;
}

export default function OptionDot({ index, className = "" }: OptionDotProps) {
  return (
    <span
      aria-hidden
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${optionDotClass(index)} ${className}`}
    />
  );
}