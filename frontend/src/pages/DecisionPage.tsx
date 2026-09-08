import { useState } from "react";
import type { KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Pencil, Plus, Wand2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { decisionsApi } from "../api";
import OptionRow from "../components/decisions/OptionRow";
import WinnerHero from "../components/decisions/WinnerHero";
import EditDecisionSheet from "../components/edit/EditDecisionSheet";
import PickOverlay from "../components/PickOverlay";
import Button from "../components/ui/Button";
import Chip from "../components/ui/Chip";
import IconButton from "../components/ui/IconButton";
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
  const [isEditing, setIsEditing] = useState(false);

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

  const renameMutation = useMutation({
    mutationFn: ({ optionId, label }: { optionId: number; label: string }) =>
      decisionsApi.updateOption(id, optionId, label),
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

  const resetWinnerMutation = useMutation({
    mutationFn: () => decisionsApi.clearWinner(id),
    onSuccess: invalidate,
  });

  if (!validId) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-lg font-semibold text-white">Decision not found</h1>
        <p className="mt-2 text-sm text-white/80">That decision doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-white">
          ← Back to your decisions
        </Link>
      </main>
    );
  }

  if (isPending) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="relative">
          {/* Back link */}
          <div className="h-4 w-16 animate-pulse rounded-full bg-white/30" />

          {/* Single edit action */}
          <div className="absolute right-0 top-0 h-9 w-9 animate-pulse rounded-full bg-white/30" />

          {/* Centered question */}
          <div className="mt-8 text-center sm:mt-10">
            <div className="mx-auto h-6 w-16 animate-pulse rounded-pill bg-white/30" />
            <div className="mx-auto mt-4 h-8 w-2/3 animate-pulse rounded-full bg-white/30 sm:h-10" />
            <div className="mx-auto mt-2.5 h-4 w-1/2 animate-pulse rounded-full bg-white/30" />
          </div>
        </div>

        {/* Decide / result area */}
        <div className="mt-6 rounded-surface border border-hairline bg-surface px-6 py-10 text-center shadow-sm">
          <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-ink/5" />
          <div className="mx-auto mt-5 h-6 w-1/3 animate-pulse rounded-full bg-ink/5" />
          <div className="mx-auto mt-3 h-4 w-1/2 animate-pulse rounded-full bg-ink/5" />
          <div className="mx-auto mt-7 h-10 w-48 animate-pulse rounded-row bg-ink/5" />
        </div>

        {/* Options list */}
        <section className="mt-10">
          <div className="h-4 w-24 animate-pulse rounded-full bg-white/30" />
          <ul className="mt-2 divide-y divide-hairline rounded-surface border border-hairline bg-surface shadow-sm">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-ink/5" />
                <div className="h-4 w-1/3 animate-pulse rounded-full bg-ink/5" />
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  }

  if (isError || !decision) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm text-white/90">
          Couldn't load this decision — {error?.message ?? "unknown error"}.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-white">
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
      <div className="relative">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white/75 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        {/* Single edit action — everything else lives behind it */}
        {isEditing ? (
          <Button
            variant="light"
            size="sm"
            onClick={() => {
              setIsEditing(false);
              setConfirmDelete(false);
            }}
            className="absolute right-0 top-0"
          >
            Done
          </Button>
        ) : (
          <IconButton
            label="Edit decision"
            tone="light"
            className="absolute right-0 top-0 h-9 w-9"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </IconButton>
        )}

        {/* The question — the main focus of the page */}
        <div className="mt-8 text-center sm:mt-10">
          {isDecided && (
            <Chip tone="light">
              <Check className="h-3 w-3" /> Decided
            </Chip>
          )}
          <h1 className="mx-auto mt-4 max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {decision.title}
          </h1>
          {decision.description && (
            <p className="mx-auto mt-2 max-w-md text-sm text-white/85">
              {decision.description}
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <EditDecisionSheet decision={decision} onClose={() => setIsEditing(false)} />
        )}
      </AnimatePresence>

      {isDecided && decision.winner && (
        <WinnerHero
          winner={decision.winner}
          winnerIndex={decision.options.findIndex((o) => o.id === decision.winner!.id)}
          onPickAgain={handlePick}
          onReset={() => resetWinnerMutation.mutate()}
          busy={pickMutation.isPending || resetWinnerMutation.isPending}
        />
      )}

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/80">
          Options · {decision.options.length}
        </h2>
        <ul className="mt-2 divide-y divide-hairline rounded-surface border border-hairline bg-surface shadow-sm">
          {decision.options.map((option, index) => (
            <OptionRow
              key={option.id}
              option={option}
              index={index}
              isWinner={decision.winner?.id === option.id}
              editable={isEditing}
              canRemove={decision.options.length > 2 && !removeMutation.isPending}
              onRename={(label) => renameMutation.mutate({ optionId: option.id, label })}
              onRemove={() => removeMutation.mutate(option.id)}
            />
          ))}
        </ul>

        {isEditing && (
          <>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={onOptionKeyDown}
                placeholder="Add another option…"
                maxLength={120}
                className="field w-full px-3.5 py-2.5 text-sm"
              />
              <Button
                variant="secondary"
                onClick={handleAddOption}
                disabled={!newOption.trim() || addMutation.isPending}
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            {addMutation.isError && (
              <p className="mt-1.5 text-xs text-danger">{addMutation.error.message}</p>
            )}
            {removeMutation.isError && (
              <p className="mt-1.5 text-xs text-danger">{removeMutation.error.message}</p>
            )}
            {renameMutation.isError && (
              <p className="mt-1.5 text-xs text-danger">{renameMutation.error.message}</p>
            )}

            <div className="mt-6 border-t border-hairline pt-4">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? "Deleting…" : "Delete decision?"}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-sm font-medium text-danger transition-opacity hover:opacity-80"
                >
                  Delete decision
                </button>
              )}
              {deleteMutation.isError && (
                <p className="mt-1.5 text-xs text-danger">{deleteMutation.error.message}</p>
              )}
            </div>
          </>
        )}

        {!isDecided && !isEditing && (
          <div className="mt-8 rounded-surface border border-hairline bg-surface p-6 text-center shadow-sm">
            <h3 className="text-base font-semibold text-ink">Let the app decide</h3>
            <p className="mt-1 text-sm text-ink-tertiary">
              {decision.options.length >= 2
                ? `A fair, random pick from your ${decision.options.length} options.`
                : "Add at least two options to decide."}
            </p>
            <Button
              className="mt-4 w-full"
              onClick={handlePick}
              disabled={decision.options.length < 2 || pickMutation.isPending}
            >
              <Wand2 className="h-4 w-4" />
              {pickMutation.isPending ? "Deciding…" : "Decide"}
            </Button>
            {pickMutation.isError && (
              <p className="mt-2 text-xs text-danger">{pickMutation.error.message}</p>
            )}
          </div>
        )}
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