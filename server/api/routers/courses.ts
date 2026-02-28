import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addCourse,
  approveCourse,
  deleteCourse,
  getAllCoursesForAdmin,
  getPendingCourses,
  getVisibleCourses,
  rejectCourse,
  verifyCourse,
} from "@/lib/courses";
import { migrateJsonToDb } from "@/lib/db/migrate";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";

export const coursesRouter = createTRPCRouter({
  migrate: adminProcedure.mutation(async () => {
    await migrateJsonToDb();
    return { success: true };
  }),

  getAll: publicProcedure
    .input(
      z
        .object({
          userId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      return await getVisibleCourses(input?.userId);
    }),

  getAllForAdmin: adminProcedure.query(async () => {
    return await getAllCoursesForAdmin();
  }),

  getPending: adminProcedure.query(async () => {
    return await getPendingCourses();
  }),

  add: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        linkId: z.string().min(1),
        year: z.number().min(1).max(6).optional(),
        academicYear: z.string().optional(),
        userId: z.string().optional(),
        addedBy: z.string().default("user"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const isAdmin = ctx.isAdmin;
      const status =
        isAdmin && input.addedBy === "admin" ? "approved" : "pending";
      const verified = isAdmin && input.addedBy === "admin";

      return await addCourse({
        ...input,
        status,
        verified,
      });
    }),

  approve: adminProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const success = await approveCourse(input.courseId);
        return { success };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Errore durante l'approvazione",
        });
      }
    }),

  reject: adminProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await rejectCourse(input.courseId);
      return { success };
    }),

  verify: adminProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await verifyCourse(input.courseId);
      return { success };
    }),

  delete: adminProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await deleteCourse(input.courseId);
      return { success };
    }),
});
