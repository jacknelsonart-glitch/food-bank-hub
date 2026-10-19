import { timingSafeEqual } from "node:crypto";

const STAFF_PAGES = ["/intake", "/parcel", "/staff"];

/** Whether a request needs the staff password. Public: finding food, the calendar, and signing up. */
export function needsStaff(pathname: string, method: string): boolean {
  if (STAFF_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  if (!pathname.startsWith("/api/")) return false;
  if (method === "GET" && (pathname === "/api/banks" || pathname === "/api/calendar.ics")) return false;
  if (method === "POST" && pathname === "/api/signups") return false;
  return true;
}

/** Checks an HTTP Basic auth header against the staff password. Any username is accepted. */
export function isStaffAuthorised(authorization: string | null, password: string): boolean {
  if (!authorization?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
  const given = Buffer.from(decoded.slice(decoded.indexOf(":") + 1));
  const expected = Buffer.from(password);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
