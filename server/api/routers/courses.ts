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
import { createTRPCRouter, publicProcedure } from "../trpc";

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

  getAllForAdmin: publicProcedure.query(() => {
    return getAllCoursesForAdmin();
  }),

  getPending: publicProcedure.query(() => {
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
    .mutation(({ input }) => {
      return addCourse({
        name: input.name,
        linkId: input.linkId,
        year: input.year,
        academicYear: input.academicYear,
        status: "pending",
        verified: false,
        addedBy: input.addedBy,
        userId: input.userId,
      });
    }),

  approve: publicProcedure
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

  reject: publicProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(({ input }) => {
      const success = rejectCourse(input.courseId);
      return { success };
    }),

  verify: publicProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(({ input }) => {
      const success = verifyCourse(input.courseId);
      return { success };
    }),

  delete: publicProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(({ input }) => {
      const success = deleteCourse(input.courseId);
      return { success };
    }),
});
