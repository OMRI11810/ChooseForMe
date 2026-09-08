import { motion } from "framer-motion";
import { Check, RefreshCw, RotateCcw } from "lucide-react";
import type { DecisionOption } from "../../types";
import { optionDotClass } from "../OptionDot";
import Button from "../ui/Button";

interface WinnerHeroProps {
  winner: DecisionOption;
  /** Index of the winner within the decision's options (drives the dot color). */
  winnerIndex: number;
  onPickAgain: () => void;
  onReset: () => void;
  busy?: boolean;
}

/**
 * The decision result — the visual centerpiece of the detail page.
 *
 * Appears only once a decision is decided. The winner's label is rendered in
 * large display type and tinted with the option's dot color: the one playful,
 * colorful moment the product allows.
 */
export default function WinnerHero({
  winner,
  winnerIndex,
  onPickAgain,
  onReset,
  busy = false,
}: WinnerHeroProps) {
  const dotClass = optionDotClass(winnerIndex);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="relative mt-6 overflow-hidden rounded-surface border border-hairline bg-surface px-6 py-10 text-center shadow-sm sm:py-12"
    >
      {/* Soft warm glow behind the winner moment */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-soft blur-2xl"
      />

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-deep">
          The app decided
        </p>

        <span
          className={`mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full text-white ring-8 ring-accent-soft/50 ${dotClass}`}
          aria-hidden
        >
          <Check className="h-7 w-7" />
        </span>

        <h2 className="mt-5 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          {winner.label}
        </h2>

        <div className="mt-7 flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={onReset} disabled={busy}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={onPickAgain} disabled={busy}>
            <RefreshCw className="h-4 w-4" />
            Decide again
          </Button>
        </div>
      </div>
    </motion.section>
  );
}