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
import { adminProcedure, createTRPCRouter, publicProcedure } from "../trpc";

export const coursesRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z
        .object({
          userId: z.string().optional(),
        })
        .optional(),
    )
    .query(({ input }) => {
      return getVisibleCourses(input?.userId);
    }),

  getAllForAdmin: adminProcedure.query(() => {
    return getAllCoursesForAdmin();
  }),

  getPending: adminProcedure.query(() => {
    return getPendingCourses();
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
    .mutation(({ input, ctx }) => {
      // Se l'utente è admin, il corso viene automaticamente approvato
      const isAdmin = ctx.isAdmin;
      const status =
        isAdmin && input.addedBy === "admin" ? "approved" : "pending";
      const verified = isAdmin && input.addedBy === "admin";

      return addCourse({
        name: input.name,
        linkId: input.linkId,
        year: input.year,
        academicYear: input.academicYear,
        status,
        verified,
        addedBy: input.addedBy,
        userId: input.userId,
      });
    }),

  approve: adminProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(({ input }) => {
      try {
        const success = approveCourse(input.courseId);
        return { success };
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Errore durante l'approvazione",
        );
      }
    }),

  reject: adminProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(({ input }) => {
      const success = rejectCourse(input.courseId);
      return { success };
    }),

  verify: adminProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(({ input }) => {
      const success = verifyCourse(input.courseId);
      return { success };
    }),

  delete: adminProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(({ input }) => {
      const success = deleteCourse(input.courseId);
      return { success };
    }),
});
