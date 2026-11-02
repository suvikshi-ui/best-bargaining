/**
 * Owner email-OTP sign-in (no password). Only OWNER_EMAIL (default
 * contact@bestbargain.in) may request a code. Codes are mailed through Resend
 * when RESEND_API_KEY is set; otherwise sending fails closed (no code is
 * exposed). Sender: OTP_FROM_EMAIL (default "Best Bargain <contact@bestbargain.in>").
 */
import { emailOTP } from "better-auth/plugins";

export const DEFAULT_OWNER_EMAIL = "contact@bestbargain.in";

export function ownerOtpEmail(): string {
  return (process.env.OWNER_EMAIL?.trim() || DEFAULT_OWNER_EMAIL).toLowerCase();
}

async function sendOtpMail(to: string, otp: string): Promise<void> {
  // Local proof only: never active in production builds.
  if (process.env.NODE_ENV !== "production" && process.env.OTP_DEV_LOG === "1") {
    console.log(`[owner-otp] code for ${to}: ${otp}`);
    return;
  }
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error("Owner OTP email is not configured (RESEND_API_KEY missing).");
  const from = process.env.OTP_FROM_EMAIL?.trim() || `Best Bargain <${DEFAULT_OWNER_EMAIL}>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Your Best Bargain owner login code",
      text: `Your owner login code is ${otp}. It expires in 10 minutes. If you did not request it, ignore this email.`,
    }),
  });
  if (!res.ok) throw new Error(`OTP email failed (${res.status}).`);
}

export const ownerEmailOtpPlugin = emailOTP({
  otpLength: 6,
  expiresIn: 600,
  allowedAttempts: 3,
  async sendVerificationOTP({ email, otp, type }) {
    if (type !== "sign-in") return;
    // Silently ignore non-owner addresses (no enumeration, no mail sent).
    if (email.trim().toLowerCase() !== ownerOtpEmail()) return;
    await sendOtpMail(email, otp);
  },
});
