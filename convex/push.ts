"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import webpush from "web-push";

export const sendPush = internalAction({
  args: {
    subscription: v.any(),
    title: v.string(),
    body: v.string(),
  },
  handler: async (_ctx, args) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      console.warn("VAPID keys not set — push skipped");
      return;
    }
    webpush.setVapidDetails("mailto:info@filmduel.de", publicKey, privateKey);
    try {
      await webpush.sendNotification(
        args.subscription,
        JSON.stringify({ title: args.title, body: args.body })
      );
    } catch (e: any) {
      console.error("Push failed:", e?.statusCode, e?.body);
    }
  },
});
