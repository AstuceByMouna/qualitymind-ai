import { NextResponse } from "next/server";

const BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Context = { params: Promise<{ segments: string[] }> };

async function proxy(request: Request, context: Context, method: "GET" | "PATCH") {
  const { segments } = await context.params;
  if (segments.length !== 3 || segments[0] !== "test-cases" ||
      !UUID.test(segments[1]) || segments[2] !== "automation") {
    return NextResponse.json({ error: "Route not allowed" }, { status: 404 });
  }
  let payload: unknown;
  if (method === "PATCH") {
    try { payload = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  }
  try {
    const response = await fetch(BASE + "/api/v1/" + segments.map(encodeURIComponent).join("/"), {
      method,
      headers: method === "PATCH" ? { "Content-Type": "application/json" } : undefined,
      body: method === "PATCH" ? JSON.stringify(payload) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const data: unknown = await response.json().catch(() => ({ error: "Invalid API response" }));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Automation Hub API unavailable. Verify the QA server." }, { status: 503 });
  }
}
export async function GET(request: Request, context: Context) {
  return proxy(request, context, "GET");
}
export async function PATCH(request: Request, context: Context) {
  return proxy(request, context, "PATCH");
}
