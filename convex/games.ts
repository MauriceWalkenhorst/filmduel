import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const getOpenGames = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    
    // Eigene Spiele als Herausforderer (wo der Gegner noch dran ist oder es noch "pending" in eigener Instanz ist)
    const gamesAsChallenger = await ctx.db
      .query("games")
      .filter(q => q.and(q.eq(q.field("challengerId"), userId), q.neq(q.field("status"), "finished")))
      .collect();
      
    // Spiele wo man herausgefordert wurde oder random gematched wurde
    const gamesAsOpponent = await ctx.db
      .query("games")
      .withIndex("by_opponentId", q => q.eq("opponentId", userId as any))
      .filter(q => q.neq(q.field("status"), "finished"))
      .collect();
      
    return [...gamesAsChallenger, ...gamesAsOpponent];
  },
});

export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  }
});

export const createGame = mutation({
  args: {
    opponentId: v.string(), // User-ID oder "random"
    category: v.string(),
    rounds: v.number(),
    seed: v.number(),
    questionIndices: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not logged in");
    
    if (args.opponentId === "random") {
       // Suche offenes Random-Spiel der gleichen Kategorie
       const openGames = await ctx.db
          .query("games")
          .withIndex("by_opponentId", q => q.eq("opponentId", "random"))
          .filter(q => q.eq(q.field("status"), "challenger_done"))
          .collect();
          
       const available = openGames.find(g => g.challengerId !== userId && g.category === args.category && g.rounds === args.rounds);
       if (available) {
          // Tritt diesem Spiel als Gegner bei!
          await ctx.db.patch(available._id, {
             opponentId: userId
          });
          return available._id; 
       }
    }
    
    // Neues Spiel erstellen
    const gameId = await ctx.db.insert("games", {
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
    return gameId;
  },
});

export const submitAnswer = mutation({
  args: {
    gameId: v.id("games"),
    isCorrect: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not logged in");
    
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    
    const isChallenger = game.challengerId === userId;
    const isOpponent = game.opponentId === userId;
    if (!isChallenger && !isOpponent) throw new Error("Not part of this game");
    
    if (isChallenger) {
      const answers = [...game.challengerAnswers, args.isCorrect];
      const score = game.challengerScore + args.isCorrect;
      
      const update: any = {
        challengerAnswers: answers,
        challengerScore: score
      };
      
      if (answers.length === game.rounds) {
        update.status = "challenger_done";
      }
      await ctx.db.patch(args.gameId, update);
      
    } else {
      const answers = [...game.opponentAnswers, args.isCorrect];
      const score = game.opponentScore + args.isCorrect;
      
      const update: any = {
        opponentAnswers: answers,
        opponentScore: score
      };
      
      if (answers.length === game.rounds) {
        update.status = "finished";
        
        let winnerId = null;
        if (game.challengerScore > score) {
            winnerId = game.challengerId;
        } else if (score > game.challengerScore) {
            winnerId = game.opponentId;
        }
        update.winnerId = winnerId;
        
        // Update Stats für beide Spieler
        for (const pid of [game.challengerId, game.opponentId]) {
            const p = await ctx.db.get(pid as any);
            if (p) {
               const pScore = pid === game.challengerId ? game.challengerScore : score;
               const won = winnerId === pid;
               await ctx.db.patch(p._id, {
                  games: (p.games || 0) + 1,
                  wins: (p.wins || 0) + (won ? 1 : 0),
                  totalScore: (p.totalScore || 0) + pScore,
               });
            }
            
            // Auch einen Legacy.scores Eintrag machen, wenn gewünscht.
            // (Lass uns das hier simpel halten, Leaderboard nutzt ja ggf noch legacy_scores)
        }
      }
      await ctx.db.patch(args.gameId, update);
    }
  }
});
