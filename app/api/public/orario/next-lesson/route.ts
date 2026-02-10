import { orarioRouter } from "@/server/api/routers/orario";

const cache: Record<string, { data: unknown; expires: number }> = {};

function getCacheDuration(dayOffset: number): number {
  if (dayOffset < 0) return 0;
  if (dayOffset === 0) return 30 * 60 * 1000;
  return 4 * 60 * 60 * 1000;
}

function getCacheKey(dayOffset: number): string {
  return `nextLesson_${dayOffset}`;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const dayOffset = Number(url.searchParams.get("dayOffset") ?? 0);

    const cacheKey = getCacheKey(dayOffset);
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

    const caller = orarioRouter.createCaller({
      isAdmin: false,
      headers: req.headers,
    });
    const result = await caller.getNextLesson({ dayOffset });

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
