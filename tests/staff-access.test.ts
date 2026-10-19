import { describe, expect, it } from "vitest";
import { hasStaffCookie, isStaffAuthorised, needsStaff, staffToken } from "@/lib/staff-access";
import { safeNext } from "@/lib/staff-next";

const basic = (user: string, pass: string) => `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;

describe("staff access", () => {
  it("keeps finding food and signing up public", () => {
    expect(needsStaff("/", "GET")).toBe(false);
    expect(needsStaff("/calendar", "GET")).toBe(false);
    expect(needsStaff("/api/banks", "GET")).toBe(false);
    expect(needsStaff("/api/calendar.ics", "GET")).toBe(false);
    expect(needsStaff("/api/signups", "POST")).toBe(false);
    expect(needsStaff("/staff-login", "GET")).toBe(false);
  });

  it("protects staff pages, sign-up lists and changes", () => {
    expect(needsStaff("/intake", "GET")).toBe(true);
    expect(needsStaff("/staff/signups", "GET")).toBe(true);
    expect(needsStaff("/api/signups", "GET")).toBe(true);
    expect(needsStaff("/api/banks", "POST")).toBe(true);
    expect(needsStaff("/api/lookup/photo", "POST")).toBe(true);
    expect(needsStaff("/intakes-public", "GET")).toBe(false);
  });

  it("checks the password, not the username", () => {
    expect(isStaffAuthorised(basic("anyone", "s3cret:x"), "s3cret:x")).toBe(true);
    expect(isStaffAuthorised(basic("anyone", "wrong"), "s3cret:x")).toBe(false);
    expect(isStaffAuthorised(null, "s3cret:x")).toBe(false);
    expect(isStaffAuthorised("Bearer abc", "s3cret:x")).toBe(false);
  });

  it("accepts the sign-in cookie only for the current password", () => {
    expect(hasStaffCookie(staffToken("s3cret"), "s3cret")).toBe(true);
    expect(hasStaffCookie(staffToken("old"), "s3cret")).toBe(false);
    expect(hasStaffCookie("s3cret", "s3cret")).toBe(false);
    expect(hasStaffCookie(undefined, "s3cret")).toBe(false);
  });

  it("only sends people back to pages on this site after signing in", () => {
    expect(safeNext("/parcel?bank=2")).toBe("/parcel?bank=2");
    expect(safeNext("//evil.example")).toBe("/staff");
    expect(safeNext("https://evil.example")).toBe("/staff");
    expect(safeNext(null)).toBe("/staff");
  });
});
