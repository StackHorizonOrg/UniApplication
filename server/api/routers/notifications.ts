import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const notificationsRouter = createTRPCRouter({
  subscribe: publicProcedure
    .input(
      z.object({
        linkId: z.string(),
        filters: z.array(z.string()).optional(),
        subscription: z.object({
          endpoint: z.string(),
          keys: z.object({
            p256dh: z.string(),
            auth: z.string(),
          }),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) throw new Error("User ID non trovato");

      const existing = await db.query.pushSubscriptions.findFirst({
        where: and(
          eq(pushSubscriptions.userId, ctx.userId),
          eq(pushSubscriptions.linkId, input.linkId),
          eq(pushSubscriptions.endpoint, input.subscription.endpoint),
        ),
      });

      if (existing) {
        await db
          .update(pushSubscriptions)
          .set({ filters: JSON.stringify(input.filters || []) })
          .where(eq(pushSubscriptions.id, existing.id));
        return { success: true };
      }

      await db.insert(pushSubscriptions).values({
        userId: ctx.userId,
        linkId: input.linkId,
        endpoint: input.subscription.endpoint,
        p256dh: input.subscription.keys.p256dh,
        auth: input.subscription.keys.auth,
        filters: JSON.stringify(input.filters || []),
      });

      return { success: true };
    }),

  updateAllFilters: publicProcedure
    .input(z.object({ filters: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) return { success: false };

      await db
        .update(pushSubscriptions)
        .set({ filters: JSON.stringify(input.filters) })
        .where(eq(pushSubscriptions.userId, ctx.userId));

      return { success: true };
    }),

  unsubscribe: publicProcedure
    .input(z.object({ linkId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) return { success: false };

      await db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.userId),
            eq(pushSubscriptions.linkId, input.linkId),
          ),
        );

      return { success: true };
    }),
});
