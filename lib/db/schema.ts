import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const courses = mysqlTable("courses", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  linkId: varchar("linkId", { length: 255 }).notNull(),
  year: int("year"),
  academicYear: varchar("academic_year", { length: 255 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected"])
    .notNull()
    .default("pending"),
  verified: boolean("verified").notNull().default(false),
  addedBy: varchar("added_by", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const analyticsUsers = mysqlTable("analytics_users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  lastSeen: timestamp("last_seen").notNull().defaultNow().onUpdateNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const apiLogs = mysqlTable("api_logs", {
  id: int("id").primaryKey().autoincrement(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export type DbCourse = typeof courses.$inferSelect;
export type NewDbCourse = typeof courses.$inferInsert;
export type AnalyticsUser = typeof analyticsUsers.$inferSelect;
export type ApiLog = typeof apiLogs.$inferSelect;
