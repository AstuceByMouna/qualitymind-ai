import { NextResponse } from "next/server";

const BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid requirement ID" }, { status: 400 });
  let data: unknown;
  try { data = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ error: "Invalid criterion" }, { status: 400 });
  }
  const fields = data as Record<string, unknown>;
  const content = typeof fields.content === "string" ? fields.content.trim() : "";
  if (Object.keys(fields).length !== 1 || !Object.prototype.hasOwnProperty.call(fields, "content") ||
      !content || content.length > 2000 || content.includes(String.fromCharCode(0))) {
    return NextResponse.json({ error: "Enter a criterion of 1–2,000 characters." }, { status: 400 });
  }
  try {
    const response = await fetch(BASE + "/api/v1/requirements/" + encodeURIComponent(id) + "/acceptance-criteria", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 404) return NextResponse.json({ error: "Requirement not found." }, { status: 404 });
    if (!response.ok) return NextResponse.json({
      error: "Save not confirmed. Reload before retrying.",
    }, { status: response.status === 422 ? 422 : 502 });
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("id" in result) ||
        typeof result.id !== "string" || !("requirement_id" in result) ||
        result.requirement_id !== id) {
      return NextResponse.json({ error: "Save result not confirmed. Reload before retrying." }, { status: 502 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Save not confirmed. Reload before retrying." }, { status: 503 });
  }
}
