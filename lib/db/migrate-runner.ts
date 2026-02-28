import path from "node:path";
import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

dotenv.config({ path: ".env.local" });

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  const connection = await mysql.createConnection(databaseUrl);
  const db = drizzle(connection);

  try {
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });
  } catch (error) {
    console.error("Error applying migrations:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
