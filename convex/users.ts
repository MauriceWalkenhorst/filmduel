import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    
    // Fallback if googleId/displayName are not set directly
    return {
      _id: user._id,
      displayName: user.displayName || user.name || "Gast",
      wins: user.wins || 0,
      games: user.games || 0,
      totalScore: user.totalScore || 0,
    };
  },
});

export const searchByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    if (!args.name) return null;
    const users = await ctx.db.query("users").collect();
    
    // Case-insensitive exact match
    const nameLower = args.name.toLowerCase();
    const match = users.find(u => {
      const uName = (u.displayName || u.name || "").toLowerCase();
      return uName === nameLower;
    });
    
    if (match) {
      return { _id: match._id, displayName: match.displayName || match.name || "Gast" };
    }
    return null;
  },
});

// Internes Update-Helper
export const updateStats = mutation({
  args: { 
    userId: v.id("users"), 
    won: v.boolean(),
    score: v.number() 
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    await ctx.db.patch(args.userId, {
      games: (user.games || 0) + 1,
      wins: (user.wins || 0) + (args.won ? 1 : 0),
      totalScore: (user.totalScore || 0) + args.score,
    });
  },
});
