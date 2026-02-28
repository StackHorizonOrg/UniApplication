import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { sql } from "drizzle-orm";

async function main() {
  const { db } = await import("./lib/db");
  try {
    console.log("Inspecting courses table...");
    const r = await db.execute(sql`DESCRIBE courses`);
    console.log(JSON.stringify(r[0], null, 2));

    console.log("Testing select query...");
    const test = await db.execute(sql`SELECT * FROM courses LIMIT 1`);
    console.log("Select test result:", JSON.stringify(test[0], null, 2));
  } catch (error) {
    console.error("Error inspecting database:", error);
  } finally {
    process.exit(0);
  }
}

main();
