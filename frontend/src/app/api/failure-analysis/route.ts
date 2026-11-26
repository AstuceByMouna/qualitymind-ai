import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  // Never log or echo the submitted excerpt.
  try {
    const response = await fetch(API_BASE_URL + "/api/v1/failure-analysis/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const result: unknown = await response.json().catch(() => ({ error: "Invalid API response" }));
    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Failure Analysis API unavailable. Verify the QA server." }, { status: 503 });
  }
}
