import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTokenFromRequest } from "@/lib/middleware";

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized - No token provided",
        },
        { status: 401 }
      );
    }

    const session = await getSession(token);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized - Invalid or expired token",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
          username: session.user.username,
          name: session.user.name,
          role: session.user.role,
        },
      },
      message: "Authenticated",
    });
  } catch (error) {
    console.error("Error checking auth:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
