import { NextResponse } from "next/server";

const AUTH_COOKIE = "pb_auth";

export function middleware(request) {
	const { pathname } = request.nextUrl;
	if (pathname.startsWith("/admin")) {
		const token = request.cookies.get(AUTH_COOKIE)?.value;
		if (!token) {
			const url = request.nextUrl.clone();
			url.pathname = "/login";
			return NextResponse.redirect(url);
		}
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/admin/:path*"],
};