import { NextResponse } from "next/server";
import { maxJiraPreviewBytes, previewJiraIssues } from "@/lib/jira-preview";

export async function POST(request: Request) {
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 });
  }

  const body = new Uint8Array(maxJiraPreviewBytes);
  const reader = request.body?.getReader();
  let size = 0;
  try {
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (size + value.byteLength > body.length) {
          await reader.cancel();
          return NextResponse.json({ error: "Fixture exceeds 128 KiB." }, { status: 413 });
        }
        body.set(value, size);
        size += value.byteLength;
      }
    }
    let input: unknown;
    try {
      input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body.subarray(0, size)));
    } catch {
      return NextResponse.json({ error: "Enter valid JSON." }, { status: 400 });
    }

    try {
      return NextResponse.json({ issues: previewJiraIssues(input) }, {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid fixture." }, { status: 422 });
    }
  } catch {
    return NextResponse.json({ error: "Unable to read the fixture." }, { status: 400 });
  } finally {
    reader?.releaseLock();
  }
}
