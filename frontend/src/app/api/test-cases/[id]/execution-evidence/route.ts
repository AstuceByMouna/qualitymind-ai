import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const MAX_IMPORT_BYTES = 4096;
type Context = { params: Promise<{ id: string }> };

async function proxy(request: Request, { params }: Context, method: "GET" | "POST") {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ detail: "Invalid test case." }, { status: 400 });
  const path = API_BASE_URL + "/api/v1/test-cases/" + id + "/execution-evidence";

  try {
    let body: Uint8Array<ArrayBuffer> | undefined;
    let query = "";
    if (method === "POST") {
      if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
        return NextResponse.json({ detail: "Expected application/json." }, { status: 415 });
      }
      body = new Uint8Array(MAX_IMPORT_BYTES);
      let size = 0;
      const reader = request.body?.getReader();
      if (reader) {
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (size + value.byteLength > MAX_IMPORT_BYTES) {
              await reader.cancel();
              return NextResponse.json({ detail: "Import exceeds 4096 bytes." }, { status: 413 });
            }
            body.set(value, size);
            size += value.byteLength;
          }
        } finally {
          reader.releaseLock();
        }
      }
      body = body.subarray(0, size);
    } else {
      const offset = new URL(request.url).searchParams.get("offset");
      if (offset !== null) {
        if (!/^\d{1,10}$/.test(offset) || Number(offset) > 2147483647) {
          return NextResponse.json({ detail: "Invalid history offset." }, { status: 400 });
        }
        query = "?offset=" + offset;
      }
    }

    const response = await fetch(path + query, {
      method, body, headers: body ? { "Content-Type": "application/json" } : undefined,
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000),
    });
    return NextResponse.json(await response.json(), {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ detail: "Execution evidence API unavailable." }, { status: 503 });
  }
}

export function GET(request: Request, context: Context) {
  return proxy(request, context, "GET");
}

export function POST(request: Request, context: Context) {
  return proxy(request, context, "POST");
}
