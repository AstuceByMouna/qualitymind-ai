import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type FieldName = "title" | "description";
type FieldErrors = Partial<Record<FieldName, string>>;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid requirement data." }, { status: 400 });
  }

  const fields = body as Record<string, unknown>;
  const fieldErrors: FieldErrors = {};
  const title = typeof fields.title === "string" ? fields.title.trim() : "";
  const description = typeof fields.description === "string" ? fields.description.trim() : "";

  if (!title || title.length > 255 || title.includes("\0")) {
    fieldErrors.title = "Title must contain 1–255 characters and no NUL characters.";
  }
  if (!description || description.length > 10000 || description.includes("\0")) {
    fieldErrors.description = "Description must contain 1–10,000 characters and no NUL characters.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      { error: "Please correct the highlighted fields.", fieldErrors },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/requirements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: response.status === 422
            ? "The API rejected the requirement. Review the entered values."
            : "Unable to save the requirement. Please try again.",
        },
        { status: response.status === 422 ? 422 : 502 },
      );
    }

    const created: unknown = await response.json();
    if (created === null || typeof created !== "object" || !("id" in created) ||
        typeof created.id !== "string" || !UUID_PATTERN.test(created.id)) {
      return NextResponse.json(
        { error: "The API returned an unexpected result. Check the registry before retrying." },
        { status: 502 },
      );
    }

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Requirements API unavailable. Verify FastAPI and PostgreSQL, then try again." },
      { status: 503 },
    );
  }
}
