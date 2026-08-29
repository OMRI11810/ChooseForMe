import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Sparkles, X } from "lucide-react";
import type { DecisionOption } from "../types";

const SHUFFLE_MS = 1400;
const TICK_MS = 90;
const SETTLE_DISMISS_MS = 2600;

interface PickOverlayProps {
  options: DecisionOption[];
  winner: DecisionOption;
  onClose: () => void;
}

export default function PickOverlay({ options, winner, onClose }: PickOverlayProps) {
  const labels = useMemo(() => options.map((o) => o.label), [options]);
  const [shown, setShown] = useState<string>(labels[0] ?? "");
  const [settled, setSettled] = useState(false);

  // Shuffle through options, then settle on the server-chosen winner.
  useEffect(() => {
    const start = performance.now();
    const interval = window.setInterval(() => {
      if (performance.now() - start >= SHUFFLE_MS) {
        window.clearInterval(interval);
        setShown(winner.label);
        setSettled(true);
        return;
      }
      setShown((prev) => {
        const next = labels[Math.floor(Math.random() * labels.length)] ?? prev;
        if (next !== prev) return next;
        const step = labels.indexOf(prev) + 1;
        return labels[step % labels.length] ?? prev;
      });
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [labels, winner.label]);

  // Auto-dismiss shortly after settling.
  useEffect(() => {
    if (!settled) return;
    const timeout = window.setTimeout(onClose, SETTLE_DISMISS_MS);
    return () => window.clearTimeout(timeout);
  }, [settled, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={settled ? `The app decided: ${winner.label}` : "Choosing…"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 4 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-surface bg-surface p-8 text-center shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-xs font-medium uppercase tracking-widest text-ink-tertiary">
          {settled ? "The app decided" : "Deciding…"}
        </p>

        <div className="mt-4 flex min-h-20 items-center justify-center">
          <AnimatePresence mode="popLayout">
            <motion.p
              key={settled ? `winner-${winner.id}` : shown}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.12 }}
              className={`text-3xl font-semibold tracking-tight ${
                settled ? "text-success" : "text-ink"
              }`}
            >
              {settled ? winner.label : shown}
            </motion.p>
          </AnimatePresence>
        </div>

        {settled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 16 }}
            className="mx-auto mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-success text-white"
          >
            <Sparkles className="h-6 w-6" />
          </motion.div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-row bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          {settled ? <Check className="mr-1.5 inline h-4 w-4" /> : null}Done
        </button>
      </motion.div>
    </div>
  );
}