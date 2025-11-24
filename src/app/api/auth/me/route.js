import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTokenFromRequest } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized - No token provided",
          // code: "NO_TOKEN",
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
          // code: "INVALID_SESSION",
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Calculate session status
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const isExpiringSoon = timeUntilExpiry <= 5 * 60 * 1000; // 5 minutes
    const isExpired = timeUntilExpiry <= 0;

    return NextResponse.json({
      success: true,
      data: {
        user: user,
        // user: {
        //   id: session.user.id,
        //   email: session.user.email,
        //   username: session.user.username,
        //   name: session.user.name,
        //   role: session.user.role,
        // },
        session: {
          expiresAt: session.expiresAt,
          timeUntilExpiry,
          isExpiringSoon,
          isExpired,
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
        // code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
