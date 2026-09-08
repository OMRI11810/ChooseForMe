import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { decisionsApi } from "../../api";
import type { Decision } from "../../types";
import Button from "../ui/Button";

interface EditDecisionSheetProps {
  decision: Decision;
  onClose: () => void;
}

/**
 * Inline expandable panel for editing a decision's title and description.
 *
 * PATCH semantics: only changed fields are sent; an emptied description is
 * sent as `null` so it is actually cleared rather than stored as "".
 */
export default function EditDecisionSheet({ decision, onClose }: EditDecisionSheetProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(decision.title);
  const [description, setDescription] = useState(decision.description ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      decisionsApi.updateDecision(decision.id, {
        title: title.trim(),
        description: description.trim() === "" ? null : description.trim(),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["decision", decision.id] });
      void queryClient.invalidateQueries({ queryKey: ["decisions"] });
      onClose();
    },
  });

  const canSave = title.trim().length > 0 && !mutation.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim() === "" ? null : description.trim();
    // Nothing actually changed — just close without a redundant request.
    if (
      trimmedTitle === decision.title &&
      trimmedDescription === (decision.description ?? null)
    ) {
      onClose();
      return;
    }
    mutation.mutate();
  }

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="overflow-hidden"
    >
      <div className="mt-5 rounded-surface border border-hairline bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Edit decision</h2>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="edit-title"
              className="text-xs font-medium uppercase tracking-wide text-ink-tertiary"
            >
              Question
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Where should we eat tonight?"
              maxLength={120}
              autoFocus
              className="field mt-1 w-full px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="edit-description"
              className="text-xs font-medium uppercase tracking-wide text-ink-tertiary"
            >
              Notes <span className="normal-case text-ink-tertiary/70">(optional)</span>
            </label>
            <input
              id="edit-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any context you want to remember"
              maxLength={500}
              className="field mt-1 w-full px-4 py-3 text-sm"
            />
          </div>
        </div>

        {mutation.isError && (
          <p className="mt-3 text-xs text-danger">{mutation.error.message}</p>
        )}

        <div className="mt-5 flex items-center gap-2">
          <Button type="submit" disabled={!canSave}>
            <Check className="h-4 w-4" />
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>
    </motion.form>
  );
}