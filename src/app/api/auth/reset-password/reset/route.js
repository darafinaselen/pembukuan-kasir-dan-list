import {
  publicRoute,
  successResponse,
  errorResponse,
  rateLimitPresets,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendPasswordChangedNotification } from "@/lib/email";
import { logAuthEvent } from "@/lib/audit";

async function handleResetPassword(request) {
  try {
    const { email, resetToken, newPassword } = await request.json();

    if (!email || !resetToken || !newPassword) {
      return errorResponse("Semua field wajib diisi", 400);
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return errorResponse("Password minimal 8 karakter", 400);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return errorResponse("Token reset tidak valid", 400);
    }

    // Verify reset token
    if (user.resetToken !== resetToken) {
      return errorResponse("Token reset tidak valid", 400);
    }

    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return errorResponse(
        "Token reset telah kedaluwarsa. Silakan request reset ulang.",
        400
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        // Reset failed login attempts
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Delete all existing sessions for security
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // Send notification email
    try {
      await sendPasswordChangedNotification(user.email, user.name);
    } catch (emailError) {
      console.error("Failed to send notification:", emailError);
      // Don't fail the request if notification fails
    }

    // Log the event
    await logAuthEvent(
      user.id,
      "PASSWORD_RESET_COMPLETED",
      request.clientInfo.ipAddress,
      request.clientInfo.userAgent
    );

    return successResponse({
      message: "Password berhasil diubah. Silakan login dengan password baru.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return errorResponse("Terjadi kesalahan. Silakan coba lagi.", 500);
  }
}

// Public route with strict rate limit
export const POST = publicRoute(handleResetPassword, {
  rateLimit: rateLimitPresets.auth, // 5 requests per minute
});
