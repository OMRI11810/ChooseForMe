import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import type { DecisionSummary } from "../types";

interface DecisionCardProps {
  decision: DecisionSummary;
}

export default function DecisionCard({ decision }: DecisionCardProps) {
  const isDecided = decision.status === "decided";

  return (
    <Link
      to={`/decisions/${decision.id}`}
      className="group flex items-center gap-4 rounded-surface border border-hairline bg-surface p-5 shadow-sm transition-colors hover:border-accent/40 hover:bg-surface-secondary"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium text-ink">{decision.title}</h3>
          {isDecided ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
              <Check className="h-3 w-3" />
              Decided
            </span>
          ) : (
            <span className="shrink-0 rounded-pill bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink-secondary">
              Open
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-secondary">
          {decision.option_count} option{decision.option_count === 1 ? "" : "s"}
          {decision.winner && (
            <>
              {" "}
              · the app chose{" "}
              <span className="font-medium text-ink">{decision.winner.label}</span>
            </>
          )}
        </p>
      </div>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent transition-transform group-hover:translate-x-0.5">
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}