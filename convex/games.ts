import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

export const getOpenGames = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const userId = user._id.toString();

    const asChallenger = await ctx.db
      .query("games")
      .withIndex("by_challengerId", (q: any) => q.eq("challengerId", userId))
      .filter((q: any) => q.neq(q.field("status"), "finished"))
      .collect();

    const asOpponent = await ctx.db
      .query("games")
      .withIndex("by_opponentId", (q: any) => q.eq("opponentId", userId))
      .filter((q: any) => q.neq(q.field("status"), "finished"))
      .collect();

    return [...asChallenger, ...asOpponent];
  },
});

export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

export const createGame = mutation({
  args: {
    opponentId: v.string(),
    category: v.string(),
    rounds: v.number(),
    seed: v.number(),
    questionIndices: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Nicht eingeloggt");
    const userId = user._id.toString();

    if (args.opponentId === userId) throw new Error("Du kannst dich nicht selbst herausfordern");

    if (args.opponentId === "random") {
      const openGames = await ctx.db
        .query("games")
        .withIndex("by_opponentId", (q: any) => q.eq("opponentId", "random"))
        .filter((q: any) => q.eq(q.field("status"), "challenger_done"))
        .collect();

      const available = openGames.find((g: any) =>
        g.challengerId !== userId &&
        g.category === args.category &&
        g.rounds === args.rounds
      );
      if (available) {
        await ctx.db.patch(available._id, { opponentId: userId });
        return available._id;
      }
    }

    return await ctx.db.insert("games", {
      challengerId: userId,
      opponentId: args.opponentId,
      category: args.category,
      rounds: args.rounds,
      seed: args.seed,
      questionIndices: args.questionIndices,
      status: "pending",
      challengerAnswers: [],
      opponentAnswers: [],
      challengerScore: 0,
      opponentScore: 0,
      winnerId: null,
    });
  },
});

export const submitAnswer = mutation({
  args: {
    gameId: v.id("games"),
    isCorrect: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Nicht eingeloggt");
    const userId = user._id.toString();

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Spiel nicht gefunden");

    const isChallenger = game.challengerId === userId;
    const isOpponent = game.opponentId === userId;
    if (!isChallenger && !isOpponent) throw new Error("Kein Teilnehmer dieses Spiels");

    if (isChallenger) {
      const answers = [...game.challengerAnswers, args.isCorrect];
      const score = game.challengerScore + args.isCorrect;
      const update: any = { challengerAnswers: answers, challengerScore: score };
      if (answers.length === game.rounds) update.status = "challenger_done";
      await ctx.db.patch(args.gameId, update);
    } else {
      const answers = [...game.opponentAnswers, args.isCorrect];
      const score = game.opponentScore + args.isCorrect;
      const update: any = { opponentAnswers: answers, opponentScore: score };

      if (answers.length === game.rounds) {
        update.status = "finished";
        let winnerId: string | null = null;
        if (game.challengerScore > score) winnerId = game.challengerId;
        else if (score > game.challengerScore) winnerId = userId;
        update.winnerId = winnerId;

        // Stats aktualisieren
        for (const [pid, pScore, pWon] of [
          [game.challengerId, game.challengerScore, winnerId === game.challengerId],
          [userId, score, winnerId === userId],
        ] as [string, number, boolean][]) {
          const p = await ctx.db.get(pid as any);
          if (p) {
            await ctx.db.patch(p._id, {
              games: (p.games ?? 0) + 1,
              wins: (p.wins ?? 0) + (pWon ? 1 : 0),
              totalScore: (p.totalScore ?? 0) + pScore,
            });
          }
        }
      }
      await ctx.db.patch(args.gameId, update);
    }
  },
});
