import * as dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({ path: ".env.local" });

async function update() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;
  const connection = await mysql.createConnection(databaseUrl);

  try {
    console.log("Adding filters to push_subscriptions...");
    await connection.query(
      "ALTER TABLE `push_subscriptions` ADD COLUMN `filters` TEXT",
    );

    console.log("Adding last_data to course_snapshots...");
    await connection.query(
      "ALTER TABLE `course_snapshots` ADD COLUMN `last_data` LONGTEXT",
    );

    console.log("SUCCESS!");
  } catch (err) {
    console.error("Note: Columns might already exist or error occurred:", err);
  } finally {
    await connection.end();
  }
}

update();
