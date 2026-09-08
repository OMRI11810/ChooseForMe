import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import type { DecisionSummary } from "../types";
import { optionAccentClasses } from "./OptionDot";
import Chip from "./ui/Chip";

interface DecisionCardProps {
  decision: DecisionSummary;
}

export default function DecisionCard({ decision }: DecisionCardProps) {
  const isDecided = decision.status === "decided";
  const { soft, hover, bar } = optionAccentClasses(decision.id);

  return (
    <Link
      to={`/decisions/${decision.id}`}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-surface border border-hairline bg-surface p-5 shadow-sm transition-colors hover:bg-surface-secondary ${hover}`}
    >
      {/* Color accent bar — each decision card carries its own secondary color */}
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${bar}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium text-ink">{decision.title}</h3>
          {isDecided && (
            <Chip tone="accent">
              <Check className="h-3 w-3" />
              Decided
            </Chip>
          )}
        </div>
        <p className="mt-1 text-sm text-ink-secondary">
          {decision.option_count} option{decision.option_count === 1 ? "" : "s"}
          {decision.winner && (
            <>
              {" "}
              · the app chose{" "}
              <span className="font-medium text-accent-deep">{decision.winner.label}</span>
            </>
          )}
        </p>
      </div>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5 ${soft}`}
      >
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}