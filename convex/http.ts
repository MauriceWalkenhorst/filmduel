import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// POST /scores
http.route({
  path: "/scores",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    await ctx.runMutation(api.scores.submit, body);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// GET /leaderboard
http.route({
  path: "/leaderboard",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const data = await ctx.runQuery(api.scores.getLeaderboard);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

http.route({
  path: "/scores",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

http.route({
  path: "/leaderboard",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

export default http;
