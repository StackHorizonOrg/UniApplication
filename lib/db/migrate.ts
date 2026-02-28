import fs from "node:fs/promises";
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
  status: "pending" | "approved" | "rejected";
  verified: boolean;
  addedBy: string;
  userId?: string | null;
  createdAt: string;
}

export async function migrateJsonToDb() {
  try {
    const fileContent = await fs.readFile(COURSES_FILE_PATH, "utf-8");
    const { courses: jsonCourses } = JSON.parse(fileContent) as {
      courses: JsonCourse[];
    };

    if (!jsonCourses?.length) return;

    for (const course of jsonCourses) {
      const values = {
        ...course,
        createdAt: new Date(course.createdAt),
      };

      await db.insert(courses).values(values).onDuplicateKeyUpdate({
        set: values,
      });
    }
  } catch (error) {
    console.error("Migration failed:", error);
  }
}
