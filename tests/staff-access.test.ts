import { describe, expect, it } from "vitest";
import { isStaffAuthorised, needsStaff } from "@/lib/staff-access";

const basic = (user: string, pass: string) => `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;

describe("staff access", () => {
  it("keeps finding food and signing up public", () => {
    expect(needsStaff("/", "GET")).toBe(false);
    expect(needsStaff("/calendar", "GET")).toBe(false);
    expect(needsStaff("/api/banks", "GET")).toBe(false);
    expect(needsStaff("/api/calendar.ics", "GET")).toBe(false);
    expect(needsStaff("/api/signups", "POST")).toBe(false);
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
});
