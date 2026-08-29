const DOT_COLORS = [
  "bg-dot-blue",
  "bg-dot-green",
  "bg-dot-orange",
  "bg-dot-pink",
  "bg-dot-purple",
  "bg-dot-teal",
] as const;

/** Deterministic dot color for the nth option in a list. */
export function optionDotClass(index: number): string {
  return DOT_COLORS[index % DOT_COLORS.length];
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