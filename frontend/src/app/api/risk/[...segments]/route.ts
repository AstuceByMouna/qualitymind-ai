import { NextResponse } from "next/server";

const BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Context = { params: Promise<{ segments: string[] }> };

async function proxy(request: Request, context: Context, method: "GET" | "PATCH") {
  const { segments } = await context.params;
  const list = segments.length === 1 && segments[0] === "requirements" && method === "GET";
  const patch = segments.length === 3 && segments[0] === "requirements" &&
    UUID.test(segments[1]) && segments[2] === "risk" && method === "PATCH";
  if (!list && !patch) return NextResponse.json({ error: "Route not allowed" }, { status: 404 });
  let payload: unknown;
  if (patch) {
    try { payload = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  }
  const path = segments.map(encodeURIComponent).join("/");
  try {
    const response = await fetch(BASE + "/api/v1/risk/" + path, {
      method,
      headers: patch ? { "Content-Type": "application/json" } : undefined,
      body: patch ? JSON.stringify(payload) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const data: unknown = await response.json().catch(() => ({ error: "Invalid API response" }));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Risk-Based Testing API unavailable. Check QA services." }, { status: 503 });
  }
}

export async function GET(request: Request, context: Context) {
  return proxy(request, context, "GET");
}
export async function PATCH(request: Request, context: Context) {
  return proxy(request, context, "PATCH");
}
