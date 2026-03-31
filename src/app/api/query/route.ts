import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { askAI } from "@/lib/ai/query-engine";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Must use nodejs runtime — postgres client is not available on edge
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting: max 20 AI queries per minute
    const { allowed, retryAfterMs } = checkRateLimit(
      `query:${userId}`,
      RATE_LIMITS.AI_QUERY
    );
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please retry in ${Math.ceil(retryAfterMs / 1000)} seconds.` },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

    const body = await request.json();
    const question = (body.question || "").trim();

    if (!question) {
      return NextResponse.json({ error: "Question cannot be empty" }, { status: 400 });
    }

    const result = await askAI(question, userId);

    // Stream the answer text back so the existing chat UI works
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(result.answer));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Query route error:", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
}
