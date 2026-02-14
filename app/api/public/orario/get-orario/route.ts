import { orarioRouter } from "@/server/api/routers/orario";
import { createTRPCContext } from "@/server/api/trpc";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-user-id",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ctx = await createTRPCContext({ headers: req.headers });
    const caller = orarioRouter.createCaller(ctx);
    const result = await caller.getOrario({
      name: body.name,
      linkId: body.linkId,
    });

    return new Response(JSON.stringify(result), { headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
