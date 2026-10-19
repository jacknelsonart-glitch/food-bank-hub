import { NextResponse, type NextRequest } from "next/server";
import { hasStaffCookie, isStaffAuthorised, needsStaff, STAFF_COOKIE } from "@/lib/staff-access";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!needsStaff(pathname, request.method)) return NextResponse.next();

  // For trying the app out on a home network only: anyone who can reach the site gets staff access.
  if (process.env.OPEN_STAFF_PAGES === "true") return NextResponse.next();

  const password = process.env.STAFF_PASSWORD;
  if (!password) {
    // Without a password, staff areas are open in development and closed in production.
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse("Staff areas are disabled until STAFF_PASSWORD is set.", { status: 503 });
  }
  if (hasStaffCookie(request.cookies.get(STAFF_COOKIE)?.value, password)) return NextResponse.next();
  // Basic auth still works for scripts and tools.
  if (isStaffAuthorised(request.headers.get("authorization"), password)) return NextResponse.next();

  if (pathname.startsWith("/api/")) return Response.json({ error: "Please sign in as staff." }, { status: 401 });
  const login = new URL("/staff-login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/intake/:path*", "/parcel/:path*", "/staff/:path*", "/api/:path*"],
};
