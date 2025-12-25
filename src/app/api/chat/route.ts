import { NextResponse } from "next/server";

type ChatRequest = {
  message: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest;

    if (!body?.message || body.message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const baseUrl = process.env.LLM_API_BASE_URL;
    const token = process.env.LLM_SERVICE_TOKEN;

    if (!baseUrl) {
      return NextResponse.json({ error: "LLM_API_BASE_URL missing" }, { status: 500 });
    }
    if (!token) {
      return NextResponse.json({ error: "LLM_SERVICE_TOKEN missing" }, { status: 500 });
    }

    const upstream = await fetch(`${baseUrl}/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Token": token,
      },
      body: JSON.stringify({ message: body.message }),
      // Optional: avoid caching
      cache: "no-store",
    });

    const text = await upstream.text();

    // Pass through status + body (FastAPI returns JSON; but keep robust)
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
