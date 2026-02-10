import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { isValidAdminToken } from "@/lib/admin";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const adminToken = opts.headers.get("x-admin-token");
  const isAdmin = isValidAdminToken(adminToken);

  return {
    ...opts,
    isAdmin,
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

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const adminProcedure = t.procedure.use(isAdminMiddleware);
