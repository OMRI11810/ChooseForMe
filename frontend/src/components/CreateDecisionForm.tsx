import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Wand2, X } from "lucide-react";
import { decisionsApi } from "../api";
import OptionDot from "./OptionDot";

const EMPTY_OPTIONS = ["", ""];

export default function CreateDecisionForm() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(EMPTY_OPTIONS);

  const mutation = useMutation({
    mutationFn: decisionsApi.create,
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setOptions(EMPTY_OPTIONS);
      void queryClient.invalidateQueries({ queryKey: ["decisions"] });
    },
  });

  const normalized = options.map((o) => o.trim()).filter(Boolean);
  const canSubmit = title.trim().length > 0 && normalized.length >= 2;

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(index: number) {
    setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || mutation.isPending) return;
    await mutation.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      options: normalized,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-surface border border-hairline bg-surface p-6 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">New decision</h2>
        <span className="rounded-pill bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
          Let the app decide
        </span>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="decision-title"
            className="text-xs font-medium uppercase tracking-wide text-ink-tertiary"
          >
            Question
          </label>
          <input
            id="decision-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Where should we eat tonight?"
            maxLength={120}
            autoFocus
            className="mt-1 w-full rounded-row border border-hairline bg-surface-secondary px-4 py-3 text-sm text-ink placeholder:text-ink-tertiary/70 focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="decision-description"
            className="text-xs font-medium uppercase tracking-wide text-ink-tertiary"
          >
            Notes <span className="normal-case text-ink-tertiary/70">(optional)</span>
          </label>
          <input
            id="decision-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any context you want to remember"
            maxLength={500}
            className="mt-1 w-full rounded-row border border-hairline bg-surface-secondary px-4 py-3 text-sm text-ink placeholder:text-ink-tertiary/70 focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-ink-tertiary">
            Options
          </span>
          <div className="mt-1 space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <OptionDot index={index} />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                  placeholder={`Option ${index + 1}`}
                  maxLength={120}
                  aria-label={`Option ${index + 1}`}
                  className="w-full rounded-row border border-hairline bg-surface-secondary px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-tertiary/70 focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  disabled={options.length <= 2}
                  aria-label={`Remove option ${index + 1}`}
                  title="Remove option"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:bg-danger/10 hover:text-danger disabled:pointer-events-none disabled:opacity-30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            <Plus className="h-4 w-4" />
            Add option
          </button>
        </div>
      </div>
      <div className="mt-6">
        <button
          type="submit"
          disabled={!canSubmit || mutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-row bg-accent py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Wand2 className="h-4 w-4" />
          {mutation.isPending ? "Creating…" : "Create decision"}
        </button>
        {!canSubmit && !mutation.isPending && (
          <p className="mt-2 text-center text-xs text-ink-tertiary">
            Give it a question and at least two options.
          </p>
        )}
        {mutation.isError && (
          <p className="mt-2 text-center text-xs text-danger">{mutation.error.message}</p>
        )}
        {mutation.isSuccess && (
          <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs font-medium text-success">
            <Check className="h-3.5 w-3.5" />
            Decision created
          </p>
        )}
      </div>
    </form>
  );
}