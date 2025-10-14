import { orarioRouter } from "@/server/api/routers/orario";

// Cache in memoria per memorizzare i risultati
const cache: Record<string, { data: any; expires: number }> = {};

// Determina la durata della cache in base al dayOffset
function getCacheDuration(dayOffset: number): number {
    if (dayOffset < 0) return 0; // Nessuna cache per i giorni precedenti
    if (dayOffset === 0) return 30 * 60 * 1000; // 30 minuti per oggi
    return 4 * 60 * 60 * 1000; // 4 ore per i giorni futuri
}

// Genera una chiave univoca per la cache
function getCacheKey(dayOffset: number): string {
    return `nextLesson_${dayOffset}`;
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const dayOffset = Number(url.searchParams.get("dayOffset") ?? 0);

        const cacheKey = getCacheKey(dayOffset);
        const cacheDuration = getCacheDuration(dayOffset);
        const now = Date.now();

        // Controlla se esiste una cache valida
        if (cacheDuration > 0 &&
            cache[cacheKey] &&
            cache[cacheKey].expires > now) {
            return Response.json(cache[cacheKey].data);
        }

        // Se non c'è cache valida, recupera i dati freschi
        const caller = orarioRouter.createCaller({ headers: req.headers });
        const result = await caller.getNextLesson({ dayOffset });

        // Memorizza in cache solo se necessario (non per i giorni precedenti)
        if (cacheDuration > 0) {
            cache[cacheKey] = {
                data: result,
                expires: now + cacheDuration
            };
        }

        return Response.json(result);
    } catch (err: any) {
        console.error("Errore nella route pubblica:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
