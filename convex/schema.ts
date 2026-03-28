import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const { users, ...otherAuthTables } = authTables;

export default defineSchema({
  ...otherAuthTables,

  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    
    // Custom Fields
    googleId: v.optional(v.string()),
    displayName: v.optional(v.string()),
    wins: v.optional(v.number()),
    games: v.optional(v.number()),
    totalScore: v.optional(v.number()),
  }).index("email", ["email"])
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
    .index("by_status", ["status"]),

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
