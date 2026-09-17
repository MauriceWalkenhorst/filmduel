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

// GET /leaderboard — reads from users table (online duel stats)
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

// GET /freikarten[?slug=…] — Freikarten-Stand lesen
// Ohne slug: der ursprüngliche Einzelzähler. Mit slug: eine selbst angelegte Seite.
http.route({
  path: "/freikarten",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const slug = new URL(req.url).searchParams.get("slug");
    const data = slug
      ? await ctx.runQuery(api.freikarten.getBySlug, { slug })
      : await ctx.runQuery(api.freikarten.get);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

// POST /freikarten — Stand setzen { month, used, slug? }
http.route({
  path: "/freikarten",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    const month = String(body.month ?? "");
    const used = Number(body.used ?? 0);
    const slug = body.slug ? String(body.slug) : null;
    try {
      if (slug) await ctx.runMutation(api.freikarten.setBySlug, { slug, month, used });
      else await ctx.runMutation(api.freikarten.set, { month, used });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e) }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }),
});

http.route({
  path: "/freikarten",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

export default http;
