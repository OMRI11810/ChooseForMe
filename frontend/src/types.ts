export type DecisionStatus = "open" | "decided";

export interface DecisionOption {
  id: number;
  label: string;
  created_at: string;
}

export interface Decision {
  id: number;
  title: string;
  description: string | null;
  status: DecisionStatus;
  winner: DecisionOption | null;
  options: DecisionOption[];
  created_at: string;
}

export interface DecisionSummary {
  id: number;
  title: string;
  description: string | null;
  status: DecisionStatus;
  winner: DecisionOption | null;
  option_count: number;
  created_at: string;
}

export interface PickResult {
  decision_id: number;
  winner: DecisionOption;
}

export interface CreateDecisionInput {
  title: string;
  description?: string;
  options: string[];
}

/**
 * Payload for PATCH /decisions/{id}.
 *
 * PATCH semantics: only fields you include are changed. Set `description`
 * explicitly to `null` to clear an existing description.
 */
export interface UpdateDecisionInput {
  title?: string;
  description?: string | null;
}