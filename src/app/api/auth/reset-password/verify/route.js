import { NextResponse } from "next/server";
import {
  publicRoute,
  // successResponse,
  errorResponse,
  rateLimitPresets,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

async function handleVerifyOTP(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return errorResponse("Email dan OTP wajib diisi", 400);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return errorResponse("OTP tidak valid atau telah kedaluwarsa", 400);
    }

    // Check if OTP matches and not expired
    if (user.resetToken !== otp) {
      return errorResponse("OTP tidak valid", 400);
    }

    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return errorResponse(
        "OTP telah kedaluwarsa. Silakan request kode baru.",
        400
      );
    }

    // OTP is valid
    // Generate a temporary token for password reset (valid for 5 minutes)
    const resetSessionToken = generateResetToken();
    const resetSessionExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Store temporary session token for password reset step
        resetToken: resetSessionToken,
        resetTokenExpiry: resetSessionExpiry,
      },
    });

    console.log("✅ OTP Verified. Token:", resetSessionToken);

    // return successResponse({
    //   message: "OTP valid. Silakan masukkan password baru.",
    //   resetToken: resetSessionToken,
    // });

    return NextResponse.json(
      {
        success: true,
        message: "OTP valid.",
        resetToken: resetSessionToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return errorResponse("Terjadi kesalahan. Silakan coba lagi.", 500);
  }
}

// Generate secure reset token
function generateResetToken() {
  return require("crypto").randomBytes(32).toString("hex");
}

// Public route with strict rate limit
export const POST = publicRoute(handleVerifyOTP, {
  rateLimit: rateLimitPresets.auth, // 5 requests per minute
});
