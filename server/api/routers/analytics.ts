import { count, desc, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { analyticsUsers, apiLogs } from "@/lib/db/schema";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";

export const analyticsRouter = createTRPCRouter({
  getStats: adminProcedure.query(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalRequests, activeToday, requestsToday] =
      await Promise.all([
        db.select({ value: count() }).from(analyticsUsers),
        db.select({ value: count() }).from(apiLogs),
        db
          .select({ value: count() })
          .from(analyticsUsers)
          .where(gte(analyticsUsers.lastSeen, today)),
        db
          .select({ value: count() })
          .from(apiLogs)
          .where(gte(apiLogs.timestamp, today)),
      ]);

    return {
      totalUsers: totalUsers[0]?.value ?? 0,
      totalRequests: totalRequests[0]?.value ?? 0,
      activeToday: activeToday[0]?.value ?? 0,
      requestsToday: requestsToday[0]?.value ?? 0,
    };
  }),

  getDailyRequests: adminProcedure.query(async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db.execute(sql`
      SELECT 
        DATE(timestamp) as date, 
        COUNT(*) as count 
      FROM api_logs 
      WHERE timestamp >= ${thirtyDaysAgo}
      GROUP BY DATE(timestamp) 
      ORDER BY date ASC
    `);

    return (result[0] as unknown as { date: string; count: number }[]) || [];
  }),

  getHourlyRequestsToday: adminProcedure.query(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db.execute(sql`
      SELECT 
        HOUR(timestamp) as hour, 
        COUNT(*) as count 
      FROM api_logs 
      WHERE timestamp >= ${today}
      GROUP BY HOUR(timestamp) 
      ORDER BY hour ASC
    `);

    return (result[0] as unknown as { hour: number; count: number }[]) || [];
  }),

  getTopEndpoints: adminProcedure.query(async () => {
    return await db
      .select({
        endpoint: apiLogs.endpoint,
        count: count(),
      })
      .from(apiLogs)
      .groupBy(apiLogs.endpoint)
      .orderBy(desc(count()))
      .limit(10);
  }),
});
