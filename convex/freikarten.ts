import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Zählerstände für Kino-Freikarten.
//
// Zwei Arten von Datensätzen:
//   - ohne slug: der ursprüngliche, einzelne Zähler (Seite /freikarten-x7q2/)
//   - mit slug:  je eine Zeile pro selbst angelegter Seite (Seite /freikarten/)
//
// Der Freikarten-Code selbst wird NICHT gespeichert. Er steht ausschließlich im
// URL-Anker der jeweiligen Seite, und der wird von Browsern nie an den Server
// gesendet. Hier liegt nur, wie viele Karten in welchem Monat eingelöst wurden.
//
// Ein Datensatz aus einem alten Monat gilt als 0 — der Reset passiert beim Lesen.

// Obergrenze als reiner Unsinns-Schutz. Wie viele Karten eine Seite tatsächlich
// hat, steht im Link der jeweiligen Person (dort bis 50 erlaubt) — hier darf
// nicht enger begrenzt werden, sonst springt der Zähler bei mehr als 10 Karten
// zurück.
const MAX = 50;

function clamp(used: number) {
  return Math.max(0, Math.min(MAX, Math.floor(used)));
}

// --- Einzelzähler (ohne slug) ---

export const get = query({
  args: {},
  handler: async (ctx) => {
    // Bewusst nicht .first(): sobald es slug-Zeilen gibt, wäre das die falsche.
    const rows = await ctx.db.query("freikarten").collect();
    const row = rows.find((r: any) => !r.slug);
    return row ? { month: row.month, used: row.used } : null;
  },
});

export const set = mutation({
  args: { month: v.string(), used: v.number() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("freikarten").collect();
    const row = rows.find((r: any) => !r.slug);
    if (row) {
      await ctx.db.patch(row._id, { month: args.month, used: clamp(args.used) });
    } else {
      await ctx.db.insert("freikarten", { month: args.month, used: clamp(args.used) });
    }
  },
});

// --- Selbst angelegte Seiten (mit slug) ---

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("freikarten")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .first();
    return row ? { month: row.month, used: row.used } : null;
  },
});

export const setBySlug = mutation({
  args: { slug: v.string(), month: v.string(), used: v.number() },
  handler: async (ctx, args) => {
    if (!/^[A-Za-z0-9_-]{6,40}$/.test(args.slug)) throw new Error("Ungültige Kennung");
    const row = await ctx.db
      .query("freikarten")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .first();
    if (row) {
      await ctx.db.patch(row._id, { month: args.month, used: clamp(args.used) });
    } else {
      await ctx.db.insert("freikarten", {
        slug: args.slug,
        month: args.month,
        used: clamp(args.used),
      });
    }
  },
});
