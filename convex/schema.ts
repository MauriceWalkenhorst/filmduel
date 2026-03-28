import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  scores: defineTable({
    player_name: v.string(),
    opponent_name: v.string(),
    winner: v.string(),
    player_score: v.number(),
    opponent_score: v.number(),
    rounds: v.number(),
    mode: v.string(),
  }).index("by_winner_score", ["winner", "player_score"]),
});
