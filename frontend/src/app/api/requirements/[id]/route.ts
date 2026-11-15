import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAVE_ERROR = "We couldn't confirm that your changes were saved. Your information is still here. Check the requirement details before trying again.";

type Context = { params: Promise<{ id: string }> };
type Field = "title" | "description";
type FieldErrors = Partial<Record<Field, string>>;

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Invalid requirement identifier." }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid requirement data." }, { status: 400 });
  }
  const fields = payload as Record<string, unknown>;
  const errors: FieldErrors = {};
  const keys = Object.keys(fields);
  if (keys.length === 0 || keys.some((key) => key !== "title" && key !== "description")) {
    return NextResponse.json({ error: "Specify title or description to update." }, { status: 400 });
  }

  const clean: Partial<Record<Field, string>> = {};
  for (const field of ["title", "description"] as const) {
    if (!Object.prototype.hasOwnProperty.call(fields, field)) continue;
    const value = fields[field];
    const trimmed = typeof value === "string" ? value.trim() : "";
    const max = field === "title" ? 255 : 10000;
    if (!trimmed || trimmed.length > max || trimmed.includes(String.fromCharCode(0))) {
      errors[field] = field === "title"
        ? "Title must contain 1–255 characters and no NUL characters."
        : "Description must contain 1–10,000 characters and no NUL characters.";
    } else {
      clean[field] = trimmed;
    }
  }
  if (Object.keys(errors).length) {
    return NextResponse.json({
      error: "Please correct the highlighted fields.", fieldErrors: errors,
    }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/requirements/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clean),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 404) {
      return NextResponse.json({ error: "This requirement no longer exists." }, { status: 404 });
    }
    if (response.status === 422) {
      return NextResponse.json({ error: "Please check the title and description." }, { status: 422 });
    }
    if (!response.ok) {
      return NextResponse.json({ error: SAVE_ERROR }, { status: 502 });
    }
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("id" in result) ||
        typeof result.id !== "string" || result.id.toLowerCase() !== id.toLowerCase()) {
      return NextResponse.json({ error: SAVE_ERROR }, { status: 502 });
    }
    return NextResponse.json({ id: result.id }, { status: 200 });
  } catch {
    return NextResponse.json({ error: SAVE_ERROR }, { status: 503 });
  }
}
