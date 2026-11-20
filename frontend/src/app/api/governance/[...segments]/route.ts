import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
const UUID = "[0-9a-fA-F-]{36}";
const GET_ALLOWED = [
  /^releases$/,
  new RegExp(`^releases/${UUID}$`),
  new RegExp(`^releases/${UUID}/readiness$`),
  new RegExp(`^releases/${UUID}/challenges$`),
  new RegExp(`^releases/${UUID}/challenges/assessment$`),
  new RegExp(`^releases/${UUID}/challenges/${UUID}$`),
  new RegExp(`^releases/${UUID}/challenges/${UUID}/history$`),
  /^requirements$/,
];
const POST_ALLOWED = [
  /^releases$/,
  new RegExp(`^releases/${UUID}/obligations$`),
  new RegExp(`^releases/${UUID}/obligations/${UUID}/evidence$`),
  new RegExp(`^releases/${UUID}/challenges$`),
  new RegExp(`^releases/${UUID}/challenges/${UUID}/transitions$`),
];

type Context = { params: Promise<{ segments: string[] }> };

async function forward(request: Request, context: Context, method: "GET" | "POST") {
  const { segments } = await context.params;
  const path = segments.join("/");
  const allowed = method === "GET" ? GET_ALLOWED : POST_ALLOWED;
  if (!allowed.some((pattern) => pattern.test(path))) {
    return NextResponse.json({ error: "Unsupported governance endpoint." }, { status: 404 });
  }
  const target = path === "requirements" ? "requirements?limit=100" : path;
  let body: string | undefined;
  if (method === "POST") {
    try {
      body = await request.text();
      if (!body || body.length > 4096) throw new Error("Invalid payload");
      JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
    }
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/${target}`, {
      method, body,
      headers: method === "POST" ? { "Content-Type": "application/json" } : {},
      cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const message = response.status === 422 ? "Please check the supplied values."
        : response.status === 404 ? "The selected item was not found."
        : response.status === 409 ? "This item already exists, or this state change is not allowed."
        : "The action could not be completed.";
      const status = [404, 409, 422].includes(response.status) ? response.status : 502;
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ error: "The governance service is temporarily unavailable." }, { status: 503 });
  }
}

export async function GET(request: Request, context: Context) { return forward(request, context, "GET"); }
export async function POST(request: Request, context: Context) { return forward(request, context, "POST"); }
