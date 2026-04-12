import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
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

    const allGames = [...asChallenger, ...asOpponent];

    return await Promise.all(allGames.map(async (g: any) => {
      const challenger = await ctx.db.get(g.challengerId as any);
      const challengerName = challenger?.displayName || challenger?.name || g.challengerId.slice(0, 8) + "…";

      let opponentName = "Zufallsgegner";
      if (g.opponentId !== "random") {
        const opponent = await ctx.db.get(g.opponentId as any);
        opponentName = opponent?.displayName || opponent?.name || g.opponentId.slice(0, 8) + "…";
      }

      return { ...g, challengerName, opponentName };
    }));
  },
});

export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    const challenger = await ctx.db.get(game.challengerId as any);
    const challengerName = challenger?.displayName || challenger?.name || game.challengerId.slice(0, 8) + "…";

    let opponentName = "Zufallsgegner";
    if (game.opponentId !== "random") {
      const opponent = await ctx.db.get(game.opponentId as any);
      opponentName = opponent?.displayName || opponent?.name || game.opponentId.slice(0, 8) + "…";
    }

    return { ...game, challengerName, opponentName };
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
    points: v.number(),
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
      const answers = [...game.challengerAnswers, args.points];
      const score = game.challengerScore + args.points;
      const update: any = { challengerAnswers: answers, challengerScore: score };
      if (answers.length === game.rounds) {
        update.status = "challenger_done";
        // Push: Gegner benachrichtigen (non-blocking)
        try {
          if (game.opponentId !== "random") {
            const sub = await ctx.db.query("pushSubscriptions")
              .withIndex("by_userId", (q: any) => q.eq("userId", game.opponentId))
              .first();
            if (sub) {
              await ctx.scheduler.runAfter(0, internal.push.sendPush, {
                subscription: sub.subscription,
                title: "FilmDuel ⚔️",
                body: "Du bist dran! Beantworte die Fragen.",
              });
            }
          }
        } catch (e) {
          console.warn("Push scheduling failed:", e);
        }
      }
      await ctx.db.patch(args.gameId, update);
    } else {
      const answers = [...game.opponentAnswers, args.points];
      const score = game.opponentScore + args.points;
      const update: any = { opponentAnswers: answers, opponentScore: score };

      if (answers.length === game.rounds) {
        update.status = "finished";
        let winnerId: string | null = null;
        if (game.challengerScore > score) winnerId = game.challengerId;
        else if (score > game.challengerScore) winnerId = userId;
        update.winnerId = winnerId;

        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

        // Stats + Streak aktualisieren
        for (const [pid, pScore, pWon] of [
          [game.challengerId, game.challengerScore, winnerId === game.challengerId],
          [userId, score, winnerId === userId],
        ] as [string, number, boolean][]) {
          const p = await ctx.db.get(pid as any);
          if (p) {
            const lastDate = (p as any).lastGameDate;
            const newStreak = lastDate === today
              ? ((p as any).streak ?? 0)
              : lastDate === yesterday
                ? ((p as any).streak ?? 0) + 1
                : 1;
            await ctx.db.patch(p._id, {
              games: (p.games ?? 0) + 1,
              wins: (p.wins ?? 0) + (pWon ? 1 : 0),
              totalScore: (p.totalScore ?? 0) + pScore,
              streak: newStreak,
              lastGameDate: today,
            });
          }
        }

        // Push: Herausforderer benachrichtigen (non-blocking)
        try {
          const sub = await ctx.db.query("pushSubscriptions")
            .withIndex("by_userId", (q: any) => q.eq("userId", game.challengerId))
            .first();
          if (sub) {
            const resultText = winnerId === game.challengerId ? "Du hast gewonnen! 🏆" : winnerId === userId ? "Dein Gegner hat gewonnen." : "Unentschieden!";
            await ctx.scheduler.runAfter(0, internal.push.sendPush, {
              subscription: sub.subscription,
              title: "FilmDuel ⚔️ Ergebnis",
              body: resultText,
            });
          }
        } catch (e) {
          console.warn("Push scheduling failed:", e);
        }
      }
      await ctx.db.patch(args.gameId, update);
    }
  },
});
