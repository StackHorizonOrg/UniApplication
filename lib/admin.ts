/**
 * Utility functions for admin authentication
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function isValidAdminToken(token: string | null | undefined): boolean {
  if (!token) return false;
  // Simple token validation - token should be base64 encoded password
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    return verifyAdminPassword(decoded);
  } catch {
    return false;
  }
}

export function createAdminToken(password: string): string | null {
  if (verifyAdminPassword(password)) {
    return Buffer.from(password).toString("base64");
  }
  return null;
}
