
export interface Requirement {
  id: string;
  title: string;
  description: string;
  created_at: string;
  status: "Draft" | "In Review" | "Ready";
  archived_at: string | null;
}

export interface RequirementListResponse {
  items: Requirement[];
  total: number;
  limit: number;
  offset: number;
}

const API_URL =
  process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

export async function getRequirements(
  limit = 50,
  offset = 0,
  query = "",
  archived = false,
): Promise<RequirementListResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (query) params.set("q", query);
  if (archived) params.set("archived", "true");
  const response = await fetch(
    `${API_URL}/api/v1/requirements?${params.toString()}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(
      `Requirements API error: HTTP ${response.status}`,
    );
  }

  return (await response.json()) as RequirementListResponse;
}

export class RequirementNotFoundError extends Error {
  constructor() {
    super("Requirement not found");
    this.name = "RequirementNotFoundError";
  }
}

export async function getRequirement(id: string): Promise<Requirement> {
  const response = await fetch(
    `${API_URL}/api/v1/requirements/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );

  if (response.status === 404) {
    throw new RequirementNotFoundError();
  }

  if (!response.ok) {
    throw new Error(`Requirements API error: HTTP ${response.status}`);
  }

  return (await response.json()) as Requirement;
}

export interface AcceptanceCriterion {
  id: string;
  requirement_id: string;
  content: string;
  position: number;
  created_at: string;
}

export async function getAcceptanceCriteria(id: string): Promise<AcceptanceCriterion[]> {
  const response = await fetch(
    API_URL + "/api/v1/requirements/" + encodeURIComponent(id) + "/acceptance-criteria",
    { cache: "no-store" },
  );
  if (response.status === 404) throw new RequirementNotFoundError();
  if (!response.ok) throw new Error("Acceptance criteria API error: HTTP " + response.status);
  const result = (await response.json()) as {items: AcceptanceCriterion[]};
  return result.items;
}
