import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createAdminToken, verifyAdminPassword } from "@/lib/admin";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const adminRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        password: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const isValid = verifyAdminPassword(input.password);

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Password non corretta",
        });
      }

      const token = createAdminToken(input.password);
      return { success: true, token };
    }),
});
