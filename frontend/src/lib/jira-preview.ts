const issueKey = /^[A-Z][A-Z0-9]{0,19}-[1-9][0-9]{0,11}$/;
export const maxJiraPreviewBytes = 128 * 1024;

type Fields = Record<string, unknown>;
type PreviewIssue = {
  key: string;
  source: "JIRA_FIXTURE";
  sourceReference: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  acceptanceCriteria: string[];
  duplicate: boolean;
  warnings: string[];
};

function record(value: unknown): value is Fields {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedText(value: unknown, max: number): string | null {
  if (typeof value !== "string" || value.length > max || value.includes("\0")) return null;
  return value.trim() || null;
}

function namedField(value: unknown): string | null {
  return record(value) ? boundedText(value.name, 100) : null;
}

export function previewJiraIssues(input: unknown): PreviewIssue[] {
  if (!record(input) || Object.keys(input).some((key) => key !== "issues") ||
      !Array.isArray(input.issues) || input.issues.length > 50) {
    throw new Error("Provide a JSON object with an issues array of up to 50 synthetic issues.");
  }

  const keys = new Set<string>();
  const duplicates = new Set<string>();
  const rows = input.issues.map((issue: unknown, index: number): PreviewIssue => {
    if (!record(issue) || typeof issue.key !== "string" || !issueKey.test(issue.key)
        || !record(issue.fields)) {
      throw new Error(`Issue ${index + 1} needs a valid Jira key and fields object.`);
    }

    const { key, fields } = issue;
    const title = boundedText(fields.summary, 255);
    if (!title) throw new Error(`Issue ${index + 1} needs a summary of 1–255 characters.`);

    const description = boundedText(fields.description, 10000);
    const status = namedField(fields.status);
    const priority = namedField(fields.priority);
    const warnings: string[] = [];
    for (const [name, value, mapped] of [
      ["Description", fields.description, description],
      ["Status", fields.status, status],
      ["Priority", fields.priority, priority],
    ] as const) {
      if (!mapped) warnings.push(value == null || value === "" ? name + " is missing." : name + " format or length is unsupported.");
    }

    const criteria: string[] = [];
    let inCriteria = false;
    for (const line of description?.split(/\r?\n/) ?? []) {
      if (/^\s*(?:#{1,6}\s+)?Acceptance Criteria\s*:?\s*$/i.test(line)) {
        inCriteria = true;
        continue;
      }
      if (!inCriteria || !line.trim()) continue;
      const bullet = /^\s*(?:[-*+] |\d+\. )(.+)$/.exec(line);
      if (!bullet) {
        inCriteria = false;
        continue;
      }
      const criterion = boundedText(bullet[1], 2000);
      if (criterion && criteria.length < 50) criteria.push(criterion);
      else if (!warnings.includes("Some acceptance criteria exceed preview limits.")) {
        warnings.push("Some acceptance criteria exceed preview limits.");
      }
    }
    if (!criteria.length) warnings.push("No explicit acceptance criteria list found.");

    if (keys.has(key)) duplicates.add(key);
    keys.add(key);
    return { key, source: "JIRA_FIXTURE", sourceReference: "Jira issue " + key, title,
      description, status, priority, acceptanceCriteria: criteria, duplicate: false, warnings };
  });
  for (const row of rows) {
    if (!duplicates.has(row.key)) continue;
    row.duplicate = true;
    row.warnings.push("Duplicate issue key in this preview.");
  }
  return rows;
}
