import { orarioRouter } from "@/server/api/routers/orario";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const dayOffset = Number(url.searchParams.get("dayOffset") ?? 0);

        const caller = orarioRouter.createCaller({ headers: req.headers });

        const result = await caller.getNextLesson({ dayOffset });

        return Response.json(result);
    } catch (err: any) {
        console.error("Errore nella route pubblica:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
