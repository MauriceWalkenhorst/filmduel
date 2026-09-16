import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Ein einziger Zählerstand für den UCI-Freikarten-Code (geteilt zwischen allen Nutzern des Links).
// Ein Datensatz aus einem alten Monat gilt als 0 — der Reset passiert implizit beim Lesen.

export const get = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("freikarten").first();
    return row ? { month: row.month, used: row.used } : null;
  },
});

export const set = mutation({
  args: { month: v.string(), used: v.number() },
  handler: async (ctx, args) => {
    const used = Math.max(0, Math.min(10, Math.floor(args.used)));
    const row = await ctx.db.query("freikarten").first();
    if (row) {
      await ctx.db.patch(row._id, { month: args.month, used });
    } else {
      await ctx.db.insert("freikarten", { month: args.month, used });
    }
  },
});
