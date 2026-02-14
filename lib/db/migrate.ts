import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";

const COURSES_FILE_PATH = path.join(process.cwd(), "data", "courses.json");

interface JsonCourse {
  id: string;
  name: string;
  linkId: string;
  year?: number | null;
  academicYear?: string | null;
  status: string;
  verified: boolean;
  addedBy: string;
  userId?: string | null;
  createdAt: string;
}

export async function migrateJsonToDb() {
  if (!fs.existsSync(COURSES_FILE_PATH)) {
    console.log("No JSON file to migrate.");
    return;
  }

  try {
    const fileContent = fs.readFileSync(COURSES_FILE_PATH, "utf-8");
    const data = JSON.parse(fileContent);
    const jsonCourses = data.courses as JsonCourse[];

    if (jsonCourses.length === 0) {
      console.log("JSON file is empty.");
      return;
    }

    console.log(`Migrating ${jsonCourses.length} courses...`);

    for (const course of jsonCourses) {
      const values = {
        id: course.id,
        name: course.name,
        linkId: course.linkId,
        year: course.year,
        academicYear: course.academicYear,
        status: course.status as "pending" | "approved" | "rejected",
        verified: course.verified,
        addedBy: course.addedBy,
        userId: course.userId,
        createdAt: new Date(course.createdAt),
      };

      await db.insert(courses).values(values).onDuplicateKeyUpdate({
        set: values,
      });
    }

    console.log("Migration completed.");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}
