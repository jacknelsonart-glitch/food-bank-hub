"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isStaffPassword, STAFF_COOKIE, STAFF_COOKIE_MAX_AGE, staffToken } from "@/lib/staff-access";
import { safeNext } from "@/lib/staff-next";

export async function signIn(_state: string | null, form: FormData): Promise<string | null> {
  const password = process.env.STAFF_PASSWORD;
  if (!password) return "Staff sign-in isn't set up: STAFF_PASSWORD is missing.";
  if (!isStaffPassword(String(form.get("password") ?? ""), password)) return "That password isn't right.";
  (await cookies()).set(STAFF_COOKIE, staffToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: STAFF_COOKIE_MAX_AGE,
    path: "/",
  });
  redirect(safeNext(form.get("next") as string | null));
}

export async function signOut() {
  (await cookies()).delete(STAFF_COOKIE);
  redirect("/");
}
