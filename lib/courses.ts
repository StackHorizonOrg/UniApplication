import fs from "node:fs";
import path from "node:path";

export type CourseStatus = "pending" | "approved" | "rejected";

export interface Course {
  id: string;
  name: string;
  linkId: string;
  year?: number;
  academicYear?: string;
  status: CourseStatus;
  verified: boolean;
  addedBy: string;
  userId?: string;
  createdAt: string;
}

export interface CoursesData {
  courses: Course[];
}

const COURSES_FILE_PATH = path.join(process.cwd(), "data", "courses.json");

export function readCourses(): CoursesData {
  try {
    if (!fs.existsSync(COURSES_FILE_PATH)) {
      const defaultData: CoursesData = { courses: [] };
      writeCourses(defaultData);
      return defaultData;
    }
    const fileContent = fs.readFileSync(COURSES_FILE_PATH, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error reading courses file:", error);
    return { courses: [] };
  }
}

export function writeCourses(data: CoursesData): void {
  try {
    const dir = path.dirname(COURSES_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(COURSES_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing courses file:", error);
  }
}

export function addCourse(course: Omit<Course, "id" | "createdAt">): Course {
  const data = readCourses();

  const existingApprovedCourse = data.courses.find(
    (c) => c.linkId === course.linkId && c.status === "approved",
  );

  if (existingApprovedCourse) {
    throw new Error(
      `Il corso "${existingApprovedCourse.name}" ha già questo link`,
    );
  }

  const newCourse: Course = {
    ...course,
    id: `course-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  data.courses.push(newCourse);
  writeCourses(data);
  return newCourse;
}

export function verifyCourse(courseId: string): boolean {
  const data = readCourses();
  const course = data.courses.find((c) => c.id === courseId);
  if (!course) return false;
  course.verified = true;
  writeCourses(data);
  return true;
}

export function deleteCourse(courseId: string): boolean {
  const data = readCourses();
  const initialLength = data.courses.length;
  data.courses = data.courses.filter((c) => c.id !== courseId);
  if (data.courses.length !== initialLength) {
    writeCourses(data);
    return true;
  }
  return false;
}

export function approveCourse(courseId: string): boolean {
  const data = readCourses();
  const course = data.courses.find((c) => c.id === courseId);
  if (!course) return false;

  const existingApproved = data.courses.find(
    (c) =>
      c.linkId === course.linkId &&
      c.status === "approved" &&
      c.id !== courseId,
  );

  if (existingApproved) {
    throw new Error(
      `Il corso "${existingApproved.name}" con questo link è già approvato`,
    );
  }

  course.status = "approved";
  writeCourses(data);
  return true;
}

export function rejectCourse(courseId: string): boolean {
  const data = readCourses();
  const course = data.courses.find((c) => c.id === courseId);
  if (!course) return false;
  course.status = "rejected";
  writeCourses(data);
  return true;
}

export function getVisibleCourses(userId?: string): Course[] {
  const data = readCourses();

  return data.courses.filter((course) => {
    const status = course.status || "approved";

    if (status === "approved") return true;

    if (userId && course.userId === userId) return true;

    return false;
  });
}

export function getPendingCourses(): Course[] {
  const data = readCourses();
  return data.courses.filter((c) => c.status === "pending");
}

export function getAllCoursesForAdmin(): Course[] {
  const data = readCourses();
  return data.courses;
}
