import { orarioRouter } from "@/server/api/routers/orario";

// Headers CORS globali
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // o il tuo dominio specifico
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const caller = orarioRouter.createCaller({ headers: req.headers });
    const result = await caller.getOrario({
      name: body.name,
    });

    // Risposta con gli header CORS inclusi
    return new Response(JSON.stringify(result), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message ?? "Errore interno" }),
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function OPTIONS() {
  // Preflight request
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
