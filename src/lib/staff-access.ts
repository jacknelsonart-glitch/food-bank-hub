import { createHmac, timingSafeEqual } from "node:crypto";

const STAFF_PAGES = ["/intake", "/parcel", "/staff"];

/** Cookie that keeps staff signed in on a device. */
export const STAFF_COOKIE = "staff_session";
export const STAFF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** Whether a request needs the staff password. Public: finding food, the calendar, and signing up. */
export function needsStaff(pathname: string, method: string): boolean {
  if (STAFF_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  if (!pathname.startsWith("/api/")) return false;
  if (method === "GET" && (pathname === "/api/banks" || pathname === "/api/calendar.ics")) return false;
  if (method === "POST" && pathname === "/api/signups") return false;
  return true;
}

function safeEqual(a: string, b: string): boolean {
  const given = Buffer.from(a);
  const expected = Buffer.from(b);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Checks an HTTP Basic auth header against the staff password. Any username is accepted. */
export function isStaffAuthorised(authorization: string | null, password: string): boolean {
  if (!authorization?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
  return safeEqual(decoded.slice(decoded.indexOf(":") + 1), password);
}

export function isStaffPassword(given: string, password: string): boolean {
  return safeEqual(given, password);
}

/** The sign-in cookie's value. Derived from the password, so changing the password signs everyone out. */
export function staffToken(password: string): string {
  return createHmac("sha256", password).update("food-bank-hub staff session v1").digest("hex");
}

export function hasStaffCookie(cookie: string | undefined, password: string): boolean {
  return cookie !== undefined && safeEqual(cookie, staffToken(password));
}
