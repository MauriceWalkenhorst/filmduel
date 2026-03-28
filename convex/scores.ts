import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    player_name: v.string(),
    opponent_name: v.string(),
    winner: v.string(),
    player_score: v.number(),
    opponent_score: v.number(),
    rounds: v.number(),
    mode: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("scores", args);
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("scores").collect();

    // Aggregate wins per player
    const map: Record<string, { name: string; wins: number; games: number; totalScore: number }> = {};
    for (const s of all) {
      [s.player_name, s.opponent_name].forEach((name) => {
        if (!map[name]) map[name] = { name, wins: 0, games: 0, totalScore: 0 };
      });
      map[s.player_name].games++;
      map[s.player_name].totalScore += s.player_score;
      if (s.winner === s.player_name) map[s.player_name].wins++;

      map[s.opponent_name].games++;
      map[s.opponent_name].totalScore += s.opponent_score;
      if (s.winner === s.opponent_name) map[s.opponent_name].wins++;
    }

    return Object.values(map)
      .sort((a, b) => b.wins - a.wins || b.totalScore - a.totalScore)
      .slice(0, 20);
  },
});
