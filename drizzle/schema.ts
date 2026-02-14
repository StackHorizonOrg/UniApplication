import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const analyticsUsers = mysqlTable("analytics_users", {
  id: varchar({ length: 255 }).notNull(),
  lastSeen: timestamp("last_seen", { mode: "string" })
    .default("current_timestamp()")
    .notNull(),
  createdAt: timestamp("created_at", { mode: "string" })
    .default("current_timestamp()")
    .notNull(),
});

export const apiLogs = mysqlTable("api_logs", {
  id: int().autoincrement().notNull(),
  endpoint: varchar({ length: 255 }).notNull(),
  method: varchar({ length: 10 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  timestamp: timestamp({ mode: "string" })
    .default("current_timestamp()")
    .notNull(),
});

export const courses = mysqlTable("courses", {
  id: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  linkId: varchar({ length: 255 }).notNull(),
  year: int(),
  academicYear: varchar("academic_year", { length: 255 }),
  status: mysqlEnum(["pending", "approved", "rejected"])
    .default("pending")
    .notNull(),
  verified: boolean().default(false).notNull(),
  addedBy: varchar("added_by", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "string" })
    .default("current_timestamp()")
    .notNull(),
});
