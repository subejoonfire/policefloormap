import { NextResponse } from "next/server";
import { sign } from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-here";

// Credentials matching the JSON file
const ADMIN_CREDENTIALS = {
  username: "admin",
  // This is just for demo, in production use proper password hashing
  password: "admin",
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      // Create token
      const token = sign(
        {
          username: username,
          role: "admin",
        },
        SECRET_KEY,
        {
          expiresIn: "1h",
        }
      );

      // Set both cookies - the session cookie for simple checks and token for API auth
      return NextResponse.json(
        {
          success: true,
          token,
        },
        {
          status: 200,
          headers: {
            "Set-Cookie": [
              `user_session=authenticated; Path=/; HttpOnly; Max-Age=3600;`,
              `token=${token}; Path=/; HttpOnly; Max-Age=3600;`,
            ],
          },
        }
      );
    }

    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
