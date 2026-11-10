
export interface Requirement {
  id: string;
  title: string;
  description: string;
  created_at: string;
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
): Promise<RequirementListResponse> {
  const response = await fetch(
    `${API_URL}/api/v1/requirements?limit=${limit}&offset=${offset}`,
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
