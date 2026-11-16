import { NextResponse } from "next/server";

const BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Context = { params: Promise<{ id: string; criterionId: string }> };

async function endpoint(context: Context) {
  const { id, criterionId } = await context.params;
  return UUID.test(id) && UUID.test(criterionId)
    ? BASE + "/api/v1/requirements/" + encodeURIComponent(id) + "/acceptance-criteria/" + encodeURIComponent(criterionId)
    : null;
}

export async function PATCH(request: Request, context: Context) {
  const url = await endpoint(context);
  if (!url) return NextResponse.json({ error: "Invalid identifier." }, { status: 400 });
  let raw: unknown;
  try { raw = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return NextResponse.json({ error: "Invalid criterion." }, { status: 400 });
  }
  const fields = raw as Record<string, unknown>;
  const content = typeof fields.content === "string" ? fields.content.trim() : "";
  if (Object.keys(fields).length !== 1 || !Object.prototype.hasOwnProperty.call(fields, "content") ||
      !content || content.length > 2000 || content.includes(String.fromCharCode(0))) {
    return NextResponse.json({ error: "Enter a criterion of 1–2,000 characters." }, { status: 400 });
  }
  try {
    const response = await fetch(url, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }), cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (response.status === 404) return NextResponse.json({ error: "Criterion not found." }, { status: 404 });
    if (!response.ok) return NextResponse.json({ error: "Update not confirmed. Reload before retrying." },
      { status: response.status === 422 ? 422 : 502 });
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string") {
      return NextResponse.json({ error: "Update result not confirmed." }, { status: 502 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Update not confirmed. Reload before retrying." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const url = await endpoint(context);
  if (!url) return NextResponse.json({ error: "Invalid identifier." }, { status: 400 });
  try {
    const response = await fetch(url, { method: "DELETE", cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (response.status === 204) return new Response(null, { status: 204 });
    if (response.status === 404) return NextResponse.json({ error: "Criterion not found." }, { status: 404 });
    return NextResponse.json({ error: "Deletion not confirmed. Reload before retrying." }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "Deletion not confirmed. Reload before retrying." }, { status: 503 });
  }
}
