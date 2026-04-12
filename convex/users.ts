import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
}

function toProfile(user: any) {
  return {
    _id: user._id.toString(),
    displayName: user.displayName || "Spieler",
    displayNameSet: user.displayNameSet ?? false,
    wins: user.wins ?? 0,
    games: user.games ?? 0,
    totalScore: user.totalScore ?? 0,
    streak: user.streak ?? 0,
  };
}

// Nach Google-Login: User erstellen oder laden
export const getOrCreateProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: identity.name,
        pictureUrl: identity.pictureUrl as string | undefined,
      });
      return toProfile(existing);
    }

    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name,
      email: identity.email,
      pictureUrl: identity.pictureUrl as string | undefined,
      displayName: identity.name || "Spieler",
      displayNameSet: false,
    });

    return {
      _id: userId.toString(),
      displayName: identity.name || "Spieler",
      displayNameSet: false,
      wins: 0,
      games: 0,
      totalScore: 0,
    };
  },
});

// Benutzernamen setzen (einmalig oder änderbar)
export const setDisplayName = mutation({
  args: { displayName: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Nicht eingeloggt");

    const name = args.displayName.trim();
    if (name.length < 2 || name.length > 20) throw new Error("Name: 2–20 Zeichen");
    if (!/^[a-zA-Z0-9_\-äöüÄÖÜß]+$/.test(name)) throw new Error("Nur Buchstaben, Zahlen, _ und - erlaubt");

    // Einzigartigkeit prüfen (per Index, nicht collect())
    const existing = await ctx.db
      .query("users")
      .withIndex("by_displayName", (q: any) => q.eq("displayName", name))
      .first();
    if (existing && existing._id.toString() !== user._id.toString()) {
      throw new Error("Name bereits vergeben");
    }

    await ctx.db.patch(user._id, {
      displayName: name,
      displayNameSet: true,
    });

    return toProfile({ ...user, displayName: name, displayNameSet: true });
  },
});

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    return toProfile(user);
  },
});

export const searchByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    if (args.name.length < 2) return [];
    const users = await ctx.db.query("users").collect();
    const nameLower = args.name.toLowerCase();
    const matches = users
      .filter((u: any) =>
        (u.displayName || "").toLowerCase().startsWith(nameLower)
      )
      .slice(0, 5);
    return matches.map((u: any) => ({
      _id: u._id.toString(),
      displayName: u.displayName,
    }));
  },
});


export const savePushSubscription = mutation({
  args: { subscription: v.any() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Nicht eingeloggt");
    const userId = user._id.toString();

    const existing = await ctx.db.query("pushSubscriptions")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { subscription: args.subscription });
    } else {
      await ctx.db.insert("pushSubscriptions", { userId, subscription: args.subscription });
    }
  },
});

