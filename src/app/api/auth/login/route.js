import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const AUTH_COOKIE = "pb_auth";

export async function POST(request) {
	try {
		const body = await request.json();
		const { username, password } = body || {};
		if (!username || !password) {
			return NextResponse.json({ success: false, message: "Username dan password wajib." }, { status: 400 });
		}
		// Simple check without hash as requested
		if (!(username === "admin" && password === "admin")) {
			return NextResponse.json({ success: false, message: "Kredensial salah." }, { status: 401 });
		}
		const token = crypto.randomBytes(24).toString("hex");
		cookies().set(AUTH_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
		return NextResponse.json({ success: true });
	} catch (e) {
		return NextResponse.json({ success: false, message: e.message }, { status: 500 });
	}
}