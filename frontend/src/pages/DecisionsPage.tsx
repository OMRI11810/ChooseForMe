import { useQuery } from "@tanstack/react-query";
import { Dice5, Sparkles } from "lucide-react";
import { decisionsApi } from "../api";
import CreateDecisionForm from "../components/CreateDecisionForm";
import DecisionCard from "../components/DecisionCard";

function EmptyState() {
  return (
    <div className="rounded-surface border border-dashed border-hairline bg-surface px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <Sparkles className="h-6 w-6" />
      </div>
      <p className="mt-4 font-medium text-ink">No decisions yet</p>
      <p className="mt-1 text-sm text-ink-tertiary">
        Ask a question above and the app will pick an answer for you.
      </p>
    </div>
  );
}

export default function DecisionsPage() {
  const { data: decisions, isPending, isError, error } = useQuery({
    queryKey: ["decisions"],
    queryFn: decisionsApi.list,
  });

  const decidedCount = decisions?.filter((d) => d.status === "decided").length ?? 0;
  const openCount = (decisions?.length ?? 0) - decidedCount;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent shadow-sm">
          <Dice5 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">ChooseForMe</h1>
          <p className="text-sm text-ink-tertiary">Can't decide? Let the app decide for you.</p>
        </div>
      </header>

      <section className="mt-8">
        <CreateDecisionForm />
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-secondary">
            Your decisions
          </h2>
          {decisions && decisions.length > 0 && (
            <span className="text-xs text-ink-tertiary">
              {openCount} open · {decidedCount} decided
            </span>
          )}
        </div>

        <div className="mt-3 space-y-3">
          {isPending && (
            <p className="rounded-surface border border-hairline bg-surface px-5 py-8 text-center text-sm text-ink-tertiary">
              Loading…
            </p>
          )}
          {isError && (
            <p className="rounded-surface border border-hairline bg-surface px-5 py-8 text-center text-sm text-danger">
              Couldn't load decisions — is the backend running? ({error.message})
            </p>
          )}
          {decisions && decisions.length === 0 && <EmptyState />}
          {decisions?.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      </section>
    </main>
  );
}