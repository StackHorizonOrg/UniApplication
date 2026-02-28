import * as dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({ path: ".env.local" });

async function update() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  const connection = await mysql.createConnection(databaseUrl);

  try {
    await connection.query(
      "ALTER TABLE `push_subscriptions` ADD COLUMN `filters` TEXT",
    );
    await connection.query(
      "ALTER TABLE `course_snapshots` ADD COLUMN `last_data` LONGTEXT",
    );
  } catch (err) {
    console.error("Update schema filters failed:", err);
  } finally {
    await connection.end();
  }
}

update();
