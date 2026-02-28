import { initTRPC, TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import superjson from "superjson";
import { ZodError } from "zod";
import { isValidAdminToken } from "@/lib/admin";
import { db } from "@/lib/db";
import { analyticsUsers, apiLogs } from "@/lib/db/schema";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const adminToken = opts.headers.get("x-admin-token");
  const userId = opts.headers.get("x-user-id");
  const isAdmin = isValidAdminToken(adminToken);

  return {
    ...opts,
    isAdmin,
    userId,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

const isAdminMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.isAdmin) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Accesso non autorizzato. Devi essere un admin.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      isAdmin: true,
    },
  });
});

const analyticsMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  if (ctx.userId) {
    const userId = ctx.userId;
    void (async () => {
      try {
        await db
          .insert(analyticsUsers)
          .values({ id: userId })
          .onDuplicateKeyUpdate({
            set: { lastSeen: sql`CURRENT_TIMESTAMP` },
          });

        await db.insert(apiLogs).values({
          endpoint: path,
          method: type,
          userId,
        });
      } catch (err) {
        console.error("Error logging analytics:", err);
      }
    })();
  }

  return next();
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure.use(analyticsMiddleware);
export const adminProcedure = t.procedure.use(isAdminMiddleware);
