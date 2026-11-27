import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Invalid requirement identifier." }, { status: 400 });
  }

  try {
    const response = await fetch(
      API_BASE_URL + "/api/v1/requirements/" + encodeURIComponent(id) + "/traceability",
      { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000) },
    );
    if (response.status === 404 || response.status === 409) {
      return NextResponse.json({ error: "Requirement unavailable." }, { status: response.status });
    }
    if (!response.ok) {
      return NextResponse.json({ error: "Traceability unavailable." }, { status: 502 });
    }
    return NextResponse.json(await response.json(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Traceability unavailable." }, { status: 503 });
  }
}
