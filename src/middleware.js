import { NextResponse } from "next/server";

// Add config export for matcher
export const config = {
  matcher: ["/admin/:path*", "/api/slideshow/:path*", "/login"],
};

export function middleware(request) {
  const session = request.cookies.get("user_session")?.value;
  const { pathname } = request.nextUrl;

  // Protect admin routes and admin API routes
  if (
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/api/slideshow")
  ) {
    if (!session || session !== "authenticated") {
      // If requesting the API, return 401
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, message: "Authentication required" },
          { status: 401 }
        );
      }

      // If requesting the admin page, redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  // Handle public routes
  if (request.nextUrl.pathname === "/login") {
    if (session === "authenticated") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}
