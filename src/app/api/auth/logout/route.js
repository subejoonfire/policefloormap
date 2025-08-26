import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const AUTH_COOKIE = "pb_auth";

export async function GET() {
	cookies().set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
	return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
}