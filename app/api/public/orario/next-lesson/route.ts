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

// Headers CORS globali
const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // tutti i domini
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

        // Controlla se esiste una cache valida
        if (
            cacheDuration > 0 &&
            cache[cacheKey] &&
            cache[cacheKey].expires > now
        ) {
            return new Response(JSON.stringify(cache[cacheKey].data), {
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders,
                },
            });
        }

        // Se non c'è cache valida, recupera i dati freschi
        const caller = orarioRouter.createCaller({ headers: req.headers });
        const result = await caller.getNextLesson({ dayOffset });

        // Memorizza in cache solo se necessario
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
    } catch (err: any) {
        console.error("Errore nella route pubblica:", err);
        return new Response(
            JSON.stringify({ error: err.message }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders,
                },
            }
        );
    }
}

// Gestione delle richieste OPTIONS (preflight)
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders,
    });
}
