import path from "node:path";
import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(process.cwd(), ".env.local") });
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

const cleanUrl = databaseUrl.replace(/^["'](.+)["']$/, "$1");

const connection = mysql.createPool({
  uri: cleanUrl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(connection, { schema, mode: "default" });
