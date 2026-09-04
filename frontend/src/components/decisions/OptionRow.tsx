import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import type { DecisionOption } from "../../types";
import OptionDot from "../OptionDot";
import IconButton from "../ui/IconButton";

interface OptionRowProps {
  option: DecisionOption;
  index: number;
  isWinner: boolean;
  /** True when edit mode is active — reveals rename/remove controls. */
  editable?: boolean;
  /** False when deleting would leave fewer than two options (backend rejects it). */
  canRemove: boolean;
  onRename: (label: string) => void;
  onRemove: () => void;
}

export default function OptionRow({
  option,
  index,
  isWinner,
  editable = false,
  canRemove,
  onRename,
  onRemove,
}: OptionRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(option.label);
  const cancelEditRef = useRef(false);

  // Leaving edit mode resets any in-progress rename.
  useEffect(() => {
    if (!editable) setEditing(false);
  }, [editable]);

  function startEditing() {
    setDraft(option.label);
    cancelEditRef.current = false;
    setEditing(true);
  }

  function commitEdit() {
    if (cancelEditRef.current) {
      cancelEditRef.current = false;
      setEditing(false);
      return;
    }
    const next = draft.trim();
    if (next && next !== option.label) onRename(next);
    setEditing(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit();
    } else if (event.key === "Escape") {
      cancelEditRef.current = true;
      setEditing(false);
    }
  }

  return (
    <li
      className={`flex items-center gap-3 px-5 py-3.5 ${isWinner ? "bg-accent-soft" : ""}`}
    >
      <OptionDot index={index} />
      {editable && editing ? (
        <>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            maxLength={120}
            autoFocus
            onFocus={(e) => e.target.select()}
            aria-label="Option label"
            className="field field-accent w-full px-3 py-1.5 text-sm"
          />
          <IconButton
            tone="accent"
            label="Save option name"
            onClick={commitEdit}
          >
            <Check className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Cancel rename"
            onClick={() => {
              cancelEditRef.current = true;
              setEditing(false);
            }}
          >
            <X className="h-4 w-4" />
          </IconButton>
        </>
      ) : (
        <>
          <span className={`flex-1 truncate text-sm ${isWinner ? "font-medium" : ""}`}>
            {option.label}
          </span>
          {isWinner && <span className="text-xs font-semibold text-accent-deep">Winner</span>}
          {editable && (
            <>
              <IconButton label={`Rename ${option.label}`} onClick={startEditing}>
                <Pencil className="h-4 w-4" />
              </IconButton>
              <IconButton
                tone="danger"
                label={`Remove ${option.label}`}
                onClick={onRemove}
                disabled={!canRemove}
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </>
          )}
        </>
      )}
    </li>
  );
}