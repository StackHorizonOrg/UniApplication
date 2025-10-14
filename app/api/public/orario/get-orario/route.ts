import { orarioRouter } from "@/server/api/routers/orario";

// Headers CORS globali
const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // tutti i domini
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const caller = orarioRouter.createCaller({ headers: req.headers });
        const result = await caller.getOrario({
            name: body.name
        });
        return Response.json(result);
    }catch(err:any){
        return new Response(
            JSON.stringify({ error: err.message ?? "Errore interno" }),
            { status: 500 },
        );
    }
}
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders,
    });
}
