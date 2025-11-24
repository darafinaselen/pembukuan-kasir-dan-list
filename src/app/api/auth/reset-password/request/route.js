import {
  publicRoute,
  successResponse,
  errorResponse,
  rateLimitPresets,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { generateOTP, sendPasswordResetOTP } from "@/lib/email";
import { logAuthEvent } from "@/lib/audit";

async function handleRequestPasswordReset(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return errorResponse("Email is required", 400);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      // Still return success to prevent email enumeration
      return successResponse({
        message: "Jika email terdaftar, kode OTP telah dikirim ke email Anda",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse(
        "Akun Anda tidak aktif. Hubungi administrator.",
        403
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // --- FITUR CHEAT: CETAK DI TERMINAL ---
    console.log("=========================================");
    console.log("🔐 RESET PASSWORD OTP:", user.email);
    console.log("👉 KODE OTP:", otp);
    console.log("=========================================");

    // Save OTP to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: otp,
        resetTokenExpiry: otpExpiry,
      },
    });

    // Send OTP via email
    try {
      await sendPasswordResetOTP(user.email, otp, user.name);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      if (process.env.NODE_ENV === "production") {
        // Di Production: JANGAN LANJUT. Beritahu user ada error sistem.
        return errorResponse(
          "Layanan email sedang gangguan. Silakan hubungi admin.",
          500
        );
      }
      console.log(
        "🚧 [DEV MODE] Mengabaikan error email agar testing bisa lanjut."
      );
    }

    // Log the event
    await logAuthEvent(
      user.id,
      "PASSWORD_RESET_REQUESTED",
      request.clientInfo.ipAddress,
      request.clientInfo.userAgent
    );

    return successResponse({
      message: "Kode OTP telah dikirim ke email Anda",
      email: user.email, // Return email for verification page
    });
  } catch (error) {
    console.error("Request password reset error:", error);
    return errorResponse("Terjadi kesalahan. Silakan coba lagi.", 500);
  }
}

// Public route with strict rate limit to prevent abuse
export const POST = publicRoute(handleRequestPasswordReset, {
  rateLimit: rateLimitPresets.auth, // 5 requests per minute
});
