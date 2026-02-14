import { orarioRouter } from "@/server/api/routers/orario";
import { createTRPCContext } from "@/server/api/trpc";

const cache: Record<string, { data: unknown; expires: number }> = {};

function getCacheDuration(dayOffset: number): number {
  if (dayOffset < 0) return 0;
  if (dayOffset === 0) return 30 * 60 * 1000;
  return 4 * 60 * 60 * 1000;
}

function getCacheKey(dayOffset: number, linkId?: string): string {
  return `nextLesson_${dayOffset}_${linkId || "default"}`;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-user-id",
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const dayOffset = Number(url.searchParams.get("dayOffset") ?? 0);
    const linkId = url.searchParams.get("linkId") || undefined;

    const cacheKey = getCacheKey(dayOffset, linkId);
    const cacheDuration = getCacheDuration(dayOffset);
    const now = Date.now();

    if (cacheDuration > 0 && cache[cacheKey] && cache[cacheKey].expires > now) {
      return new Response(JSON.stringify(cache[cacheKey].data), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    const ctx = await createTRPCContext({ headers: req.headers });
    const caller = orarioRouter.createCaller(ctx);
    const result = await caller.getNextLesson({ dayOffset, linkId });

    if (cacheDuration > 0) {
      cache[cacheKey] = {
        data: result,
        expires: now + cacheDuration,
      };
    }

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore interno";
    console.error("Errore nella route pubblica:", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
