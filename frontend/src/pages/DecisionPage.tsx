import { useState } from "react";
import type { KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Plus, Trash2, Wand2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { decisionsApi } from "../api";
import OptionDot from "../components/OptionDot";
import PickOverlay from "../components/PickOverlay";
import type { PickResult } from "../types";

export default function DecisionPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const validId = Number.isInteger(id) && id > 0;

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newOption, setNewOption] = useState("");
  const [pickResult, setPickResult] = useState<PickResult | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: decision, isPending, isError, error } = useQuery({
    queryKey: ["decision", id],
    queryFn: () => decisionsApi.get(id),
    enabled: validId,
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["decision", id] });
    void queryClient.invalidateQueries({ queryKey: ["decisions"] });
  }

  const addMutation = useMutation({
    mutationFn: (label: string) => decisionsApi.addOption(id, label),
    onSuccess: () => {
      setNewOption("");
      invalidate();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (optionId: number) => decisionsApi.removeOption(id, optionId),
    onSuccess: invalidate,
  });

  const pickMutation = useMutation({
    mutationFn: () => decisionsApi.pickWinner(id),
    onSuccess: (result) => {
      setPickResult(result);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => decisionsApi.remove(id),
    onSuccess: () => navigate("/"),
  });

  if (!validId) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-lg font-semibold text-ink">Decision not found</h1>
        <p className="mt-2 text-sm text-ink-tertiary">That decision doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-accent">
          ← Back to your decisions
        </Link>
      </main>
    );
  }

  if (isPending) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm text-ink-tertiary">Loading…</p>
      </main>
    );
  }

  if (isError || !decision) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm text-danger">
          Couldn't load this decision — {error?.message ?? "unknown error"}.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-accent">
          ← Back to your decisions
        </Link>
      </main>
    );
  }

  const isDecided = decision.status === "decided";

  function onOptionKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddOption();
    }
  }

  function handleAddOption() {
    const label = newOption.trim();
    if (!label || addMutation.isPending) return;
    addMutation.mutate(label);
  }

  function handlePick() {
    if (!pickMutation.isPending) pickMutation.mutate();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-tertiary transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <header className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">
              {decision.title}
            </h1>
            {isDecided ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
                <Check className="h-3 w-3" /> Decided
              </span>
            ) : (
              <span className="shrink-0 rounded-pill bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink-secondary">
                Open
              </span>
            )}
          </div>
          {decision.description && (
            <p className="mt-1.5 text-sm text-ink-secondary">{decision.description}</p>
          )}
        </div>

        {confirmDelete ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="rounded-pill bg-danger px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete?"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-pill bg-ink/5 px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-ink/10"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete decision"
            title="Delete decision"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      {isDecided && decision.winner && (
        <div className="mt-6 flex items-center gap-4 rounded-row border border-success/20 bg-success-soft px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success text-white">
            <Check className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-success">
              The app decided
            </p>
            <p className="truncate text-lg font-semibold text-ink">{decision.winner.label}</p>
          </div>
        </div>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-secondary">
          Options · {decision.options.length}
        </h2>
        <ul className="mt-2 divide-y divide-hairline rounded-surface border border-hairline bg-surface shadow-sm">
          {decision.options.map((option, index) => {
            const isWinner = decision.winner?.id === option.id;
            return (
              <li
                key={option.id}
                className={`flex items-center gap-3 px-5 py-3.5 ${isWinner ? "bg-success-soft" : ""}`}
              >
                <OptionDot index={index} />
                <span className={`flex-1 truncate text-sm ${isWinner ? "font-medium" : ""}`}>
                  {option.label}
                </span>
                {isWinner && <span className="text-xs font-semibold text-success">Winner</span>}
                <button
                  type="button"
                  onClick={() => removeMutation.mutate(option.id)}
                  disabled={decision.options.length <= 2 || removeMutation.isPending}
                  aria-label={`Remove ${option.label}`}
                  title="Remove option"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:bg-danger/10 hover:text-danger disabled:pointer-events-none disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
<div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={onOptionKeyDown}
            placeholder="Add another option…"
            maxLength={120}
            className="w-full rounded-row border border-hairline bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-tertiary/70 focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddOption}
            disabled={!newOption.trim() || addMutation.isPending}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-row bg-ink/5 px-4 text-sm font-medium text-ink transition-colors hover:bg-ink/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        {addMutation.isError && (
          <p className="mt-1.5 text-xs text-danger">{addMutation.error.message}</p>
        )}
        {removeMutation.isError && (
          <p className="mt-1.5 text-xs text-danger">{removeMutation.error.message}</p>
        )}

        <div className="mt-6 rounded-surface border border-hairline bg-surface p-6 text-center shadow-sm">
          <h3 className="text-base font-semibold text-ink">Let the app decide</h3>
          <p className="mt-1 text-sm text-ink-tertiary">
            {decision.options.length >= 2
              ? `A fair, random pick from your ${decision.options.length} options.`
              : "Add at least two options to decide."}
          </p>
          <button
            type="button"
            onClick={handlePick}
            disabled={decision.options.length < 2 || pickMutation.isPending}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-row bg-accent py-3.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Wand2 className="h-4 w-4" />
            {pickMutation.isPending ? "Deciding…" : isDecided ? "Decide again" : "Decide for me"}
          </button>
          {pickMutation.isError && (
            <p className="mt-2 text-xs text-danger">{pickMutation.error.message}</p>
          )}
        </div>
      </section>

      {pickResult && decision && (
        <PickOverlay
          options={decision.options}
          winner={pickResult.winner}
          onClose={() => setPickResult(null)}
        />
      )}
    </main>
  );
}