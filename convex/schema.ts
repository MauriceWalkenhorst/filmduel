import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    pictureUrl: v.optional(v.string()),
    displayName: v.optional(v.string()),
    displayNameSet: v.optional(v.boolean()),
    wins: v.optional(v.number()),
    games: v.optional(v.number()),
    totalScore: v.optional(v.number()),
    streak: v.optional(v.number()),
    lastGameDate: v.optional(v.string()),
  }).index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_displayName", ["displayName"]),

  games: defineTable({
    challengerId: v.string(),
    opponentId: v.string(),
    category: v.string(),
    rounds: v.number(),
    seed: v.number(),
    questionIndices: v.array(v.number()),
    status: v.string(),
    challengerAnswers: v.array(v.number()),
    opponentAnswers: v.array(v.number()),
    challengerScore: v.number(),
    opponentScore: v.number(),
    winnerId: v.union(v.string(), v.null()),
  })
    .index("by_opponentId", ["opponentId"])
    .index("by_status", ["status"])
    .index("by_challengerId", ["challengerId"]),

  pushSubscriptions: defineTable({
    userId: v.string(),
    subscription: v.any(),
  }).index("by_userId", ["userId"]),

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
