import nodemailer from "nodemailer";

/**
 * Email service for sending OTP and notifications
 */

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    // Configure email transporter
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

/**
 * Generate 6-digit OTP
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP email for password reset
 */
export async function sendPasswordResetOTP(email, otp, userName) {
  const transport = getTransporter();

  const mailOptions = {
    from: `"${process.env.APP_NAME || "Pembukuan Kasir"}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset Password - Kode OTP",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Password OTP</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 8px;
              padding: 32px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
            }
            .header h1 {
              color: #1a1a1a;
              font-size: 24px;
              margin: 0 0 8px 0;
            }
            .header p {
              color: #666;
              margin: 0;
            }
            .otp-box {
              background: #f8f9fa;
              border: 2px dashed #e0e0e0;
              border-radius: 8px;
              padding: 24px;
              text-align: center;
              margin: 24px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #2563eb;
              letter-spacing: 8px;
              margin: 0;
              font-family: 'Courier New', monospace;
            }
            .otp-label {
              color: #666;
              font-size: 14px;
              margin-top: 8px;
            }
            .content {
              color: #333;
              line-height: 1.8;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .warning p {
              margin: 0;
              color: #856404;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e0e0e0;
              color: #666;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #2563eb;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              margin: 16px 0;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Reset Password</h1>
              <p>Permintaan reset password untuk akun Anda</p>
            </div>
            
            <div class="content">
              <p>Halo <strong>${userName}</strong>,</p>
              <p>Kami menerima permintaan untuk mereset password akun Anda. Gunakan kode OTP berikut untuk melanjutkan proses reset password:</p>
            </div>
            
            <div class="otp-box">
              <p class="otp-code">${otp}</p>
              <p class="otp-label">Kode OTP berlaku selama 10 menit</p>
            </div>
            
            <div class="content">
              <p>Masukkan kode OTP ini di halaman reset password untuk melanjutkan.</p>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ Perhatian:</strong> Jika Anda tidak meminta reset password, abaikan email ini. Kode OTP akan kedaluwarsa dalam 10 menit.</p>
            </div>
            
            <div class="footer">
              <p>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
              <p style="margin-top: 8px; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} ${process.env.APP_NAME || "Pembukuan Kasir"}. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Reset Password - Kode OTP

Halo ${userName},

Kami menerima permintaan untuk mereset password akun Anda.
Gunakan kode OTP berikut untuk melanjutkan:

Kode OTP: ${otp}

Kode ini berlaku selama 10 menit.

Jika Anda tidak meminta reset password, abaikan email ini.

© ${new Date().getFullYear()} ${process.env.APP_NAME || "Pembukuan Kasir"}
    `.trim(),
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
}

/**
 * Send password changed notification
 */
export async function sendPasswordChangedNotification(email, userName) {
  const transport = getTransporter();

  const mailOptions = {
    from: `"${process.env.APP_NAME || "Pembukuan Kasir"}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Password Berhasil Diubah",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; margin-bottom: 24px; }
            .header h1 { color: #16a34a; margin: 0; }
            .content { color: #333; }
            .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Berhasil Diubah</h1>
            </div>
            <div class="content">
              <p>Halo <strong>${userName}</strong>,</p>
              <p>Password akun Anda telah berhasil diubah pada ${new Date().toLocaleString("id-ID")}.</p>
              <p>Jika Anda tidak melakukan perubahan ini, segera hubungi administrator sistem.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || "Pembukuan Kasir"}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transport.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending notification:", error);
    // Don't throw error for notifications
    return { success: false };
  }
}
