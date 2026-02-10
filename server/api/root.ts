import { coursesRouter } from "@/server/api/routers/courses";
import { orarioRouter } from "@/server/api/routers/orario";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  orario: orarioRouter,
  courses: coursesRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
