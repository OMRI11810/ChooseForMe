import type {
  CreateDecisionInput,
  Decision,
  DecisionSummary,
  PickResult,
  UpdateDecisionInput,
} from "./types";

const BASE_URL = "/api";

interface ApiErrorPayload {
  detail?: unknown;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as ApiErrorPayload;
      if (typeof body.detail === "string") message = body.detail;
    } catch {
      // Response had no JSON body; keep the default message.
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const decisionsApi = {
  list(): Promise<DecisionSummary[]> {
    return request("/decisions");
  },

  get(id: number): Promise<Decision> {
    return request(`/decisions/${id}`);
  },

  create(input: CreateDecisionInput): Promise<Decision> {
    const payload = {
      title: input.title,
      description: input.description,
      options: input.options.map((label) => ({ label })),
    };
    return request("/decisions", { method: "POST", body: JSON.stringify(payload) });
  },

  remove(id: number): Promise<void> {
    return request(`/decisions/${id}`, { method: "DELETE" });
  },

  updateDecision(id: number, input: UpdateDecisionInput): Promise<Decision> {
    return request(`/decisions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  addOption(id: number, label: string): Promise<Decision> {
    return request(`/decisions/${id}/options`, {
      method: "POST",
      body: JSON.stringify({ label }),
    });
  },

  updateOption(id: number, optionId: number, label: string): Promise<Decision> {
    return request(`/decisions/${id}/options/${optionId}`, {
      method: "PATCH",
      body: JSON.stringify({ label }),
    });
  },

  removeOption(id: number, optionId: number): Promise<Decision> {
    return request(`/decisions/${id}/options/${optionId}`, { method: "DELETE" });
  },

  pickWinner(id: number): Promise<PickResult> {
    return request(`/decisions/${id}/pick`, { method: "POST" });
  },

  clearWinner(id: number): Promise<Decision> {
    return request(`/decisions/${id}/winner`, { method: "DELETE" });
  },
};