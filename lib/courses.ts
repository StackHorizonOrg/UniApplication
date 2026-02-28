import { and, eq, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";

export type CourseStatus = "pending" | "approved" | "rejected";

export interface Course {
  id: string;
  name: string;
  linkId: string;
  year?: number | null;
  academicYear?: string | null;
  status: CourseStatus;
  verified: boolean;
  addedBy: string;
  userId?: string | null;
  createdAt: string;
}

interface DbCourse {
  id: string;
  name: string;
  linkId: string;
  year?: number | null;
  academicYear?: string | null;
  status: string;
  verified: boolean;
  addedBy: string;
  userId?: string | null;
  createdAt: Date;
}

function mapCourse(dbCourse: DbCourse): Course {
  return {
    ...dbCourse,
    status: dbCourse.status as CourseStatus,
    createdAt: dbCourse.createdAt.toISOString(),
  };
}

export async function addCourse(
  course: Omit<Course, "id" | "createdAt">,
): Promise<Course> {
  const existingApprovedCourse = await db.query.courses.findFirst({
    where: and(
      eq(courses.linkId, course.linkId),
      eq(courses.status, "approved"),
    ),
  });

  if (existingApprovedCourse) {
    throw new Error(
      `Il corso "${existingApprovedCourse.name}" ha già questo link`,
    );
  }

  const id = `course-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  await db.insert(courses).values({
    ...course,
    id,
  });

  const newCourse = await db.query.courses.findFirst({
    where: eq(courses.id, id),
  });

  if (!newCourse) throw new Error("Failed to create course");

  return mapCourse(newCourse as DbCourse);
}

export async function verifyCourse(courseId: string): Promise<boolean> {
  await db
    .update(courses)
    .set({ verified: true })
    .where(eq(courses.id, courseId));

  return true;
}

export async function deleteCourse(courseId: string): Promise<boolean> {
  await db.delete(courses).where(eq(courses.id, courseId));

  return true;
}

export async function approveCourse(courseId: string): Promise<boolean> {
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  });

  if (!course) return false;

  const existingApproved = await db.query.courses.findFirst({
    where: and(
      eq(courses.linkId, course.linkId),
      eq(courses.status, "approved"),
      ne(courses.id, courseId),
    ),
  });

  if (existingApproved) {
    throw new Error(
      `Il corso "${existingApproved.name}" con questo link è già approvato`,
    );
  }

  await db
    .update(courses)
    .set({ status: "approved" })
    .where(eq(courses.id, courseId));

  return true;
}

export async function rejectCourse(courseId: string): Promise<boolean> {
  await db
    .update(courses)
    .set({ status: "rejected" })
    .where(eq(courses.id, courseId));

  return true;
}

export async function getVisibleCourses(userId?: string): Promise<Course[]> {
  const result = await db.query.courses.findMany({
    where: userId
      ? or(eq(courses.status, "approved"), eq(courses.userId, userId))
      : eq(courses.status, "approved"),
  });

  return result.map((c) => mapCourse(c as DbCourse));
}

export async function getPendingCourses(): Promise<Course[]> {
  const result = await db.query.courses.findMany({
    where: eq(courses.status, "pending"),
  });
  return result.map((c) => mapCourse(c as DbCourse));
}

export async function getAllCoursesForAdmin(): Promise<Course[]> {
  const result = await db.query.courses.findMany();
  return result.map((c) => mapCourse(c as DbCourse));
}
