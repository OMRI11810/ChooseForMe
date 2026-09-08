import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { decisionsApi } from "../api";
import CreateDecisionForm from "../components/CreateDecisionForm";
import DecisionCard from "../components/DecisionCard";
import Button from "../components/ui/Button";

type FilterKey = "all" | "decided";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "decided", label: "Decided" },
];

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-surface border border-dashed border-hairline bg-surface px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-deep">
        <Sparkles className="h-6 w-6" />
      </div>
      <p className="mt-4 text-lg font-semibold text-ink">Create your first decision</p>
      <p className="mt-1 max-w-xs text-sm text-ink-tertiary">
        Ask a question, add a few options, and let the app decide for you.
      </p>
      <Button className="mt-6" onClick={onCreate}>
        <Plus className="h-4 w-4" />
        New Decision
      </Button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-surface border border-hairline bg-surface p-5 shadow-sm">
      <div className="h-4 w-2/5 animate-pulse rounded-full bg-white/30" />
      <div className="mt-3 h-3 w-1/3 animate-pulse rounded-full bg-white/30" />
    </div>
  );
}

export default function DecisionsPage() {
  const [searchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(searchParams.get("create") === "1");
  const [filter, setFilter] = useState<FilterKey>("all");
  const { data: decisions, isPending, isError, error } = useQuery({
    queryKey: ["decisions"],
    queryFn: decisionsApi.list,
  });

  const filtered =
    decisions?.filter((decision) =>
      filter === "all" || (filter === "decided" && decision.status === "decided"),
    ) ?? [];
  const hasDecisions = Boolean(decisions && decisions.length > 0);

  return (
    <main className="mx-auto max-w-2xl px-6 pb-16 pt-10">
      <section className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          My Decisions
        </h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-white/80">
          Every choice in one place — pick one, or make a new one.
        </p>
      </section>

      {/* Create action — an obvious "+ New Decision" that expands the form */}
      <section className="mt-7 text-center">
        {showCreate ? (
          <CreateDecisionForm onCreated={() => setShowCreate(false)} />
        ) : hasDecisions ? (
          <Button variant="white" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> New Decision
          </Button>
        ) : null}
      </section>

      <section className="mt-10">
        {hasDecisions && (
          <div className="inline-flex gap-0.5 rounded-pill bg-white/20 p-1">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`rounded-pill px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-white text-accent-deep shadow-sm"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3 space-y-3">
          {isPending && (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}
          {isError && (
            <p className="rounded-surface border border-hairline bg-surface px-5 py-8 text-center text-sm text-danger">
              Couldn't load decisions — is the backend running? ({error.message})
            </p>
          )}
          {!isPending && !isError && hasDecisions && filtered.length === 0 && (
            <p className="rounded-surface border border-hairline bg-surface px-5 py-8 text-center text-sm text-ink-tertiary">
              Nothing here yet.
            </p>
          )}
          {!isPending && !isError && !hasDecisions && !showCreate && (
            <EmptyState onCreate={() => setShowCreate(true)} />
          )}
          {filtered.length > 0 && (
            <motion.ul
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {filtered.map((decision) => (
                <motion.li key={decision.id} variants={itemVariants}>
                  <DecisionCard decision={decision} />
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>
      </section>
    </main>
  );
}