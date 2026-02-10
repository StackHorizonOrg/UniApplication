import { z } from "zod";
import { createAdminToken, verifyAdminPassword } from "@/lib/admin";
import { createTRPCRouter, publicProcedure } from "../trpc";

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
        throw new Error("Password non corretta");
      }

      const token = createAdminToken(input.password);
      return { success: true, token };
    }),
});
