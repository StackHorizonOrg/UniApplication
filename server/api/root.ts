import { adminRouter } from "@/server/api/routers/admin";
import { analyticsRouter } from "@/server/api/routers/analytics";
import { coursesRouter } from "@/server/api/routers/courses";
import { notificationsRouter } from "@/server/api/routers/notifications";
import { orarioRouter } from "@/server/api/routers/orario";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  orario: orarioRouter,
  courses: coursesRouter,
  admin: adminRouter,
  analytics: analyticsRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
