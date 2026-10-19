import { NextResponse, type NextRequest } from "next/server";
import { isStaffAuthorised, needsStaff } from "@/lib/staff-access";

export function proxy(request: NextRequest) {
  if (!needsStaff(request.nextUrl.pathname, request.method)) return NextResponse.next();

  // For trying the app out on a home network only: anyone who can reach the site gets staff access.
  if (process.env.OPEN_STAFF_PAGES === "true") return NextResponse.next();

  const password = process.env.STAFF_PASSWORD;
  if (!password) {
    // Without a password, staff areas are open in development and closed in production.
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse("Staff areas are disabled until STAFF_PASSWORD is set.", { status: 503 });
  }
  if (isStaffAuthorised(request.headers.get("authorization"), password)) return NextResponse.next();
  return new NextResponse("Staff password required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Food bank staff", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/intake/:path*", "/parcel/:path*", "/staff/:path*", "/api/:path*"],
};
