import { NextResponse } from "next/server";

const BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid requirement ID" }, { status: 400 });
  let payload: unknown;
  try { payload = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
      Object.keys(payload).length !== 1 || !("status" in payload) ||
      !["Draft", "In Review", "Ready"].includes(String(payload.status))) {
    return NextResponse.json({ error: "Invalid target status" }, { status: 400 });
  }
  try {
    const result = await fetch(`${BASE}/api/v1/requirements/${encodeURIComponent(id)}/transitions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!result.ok) return NextResponse.json(
      { error: result.status === 409 ? "Transition not allowed. Refresh before retrying." :
        result.status === 404 ? "Requirement not found" : "Transition could not be confirmed" },
      { status: [404, 409, 422].includes(result.status) ? result.status : 502 }
    );
    const data = await result.json();
    if (data.id?.toLowerCase() !== id.toLowerCase() || data.status !== payload.status) {
      return NextResponse.json({ error: "Unverified transition result; refresh before retrying" }, { status: 502 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Transition outcome unknown; refresh before retrying" }, { status: 503 });
  }
}
