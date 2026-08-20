import { sendEmail } from "../../services/email.service";
import { env } from "../../config/env";

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: email,
    subject: "Verify your HirePro email",
    html: `
      <h1>Verify your email</h1>

      <p>Thanks for registering with HirePro.</p>

      <p>
        Please click the button below to verify your email.
      </p>

      <p>
        <a href="${verificationUrl}">
          Verify Email
        </a>
      </p>

      <p>This link expires in 15 minutes.</p>

      <p>
        If you did not create this account, you can safely ignore this email.
      </p>
    `,
  });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: email,
    subject: "Reset your HirePro password",
    html: `
      <h1>Reset your password</h1>

      <p>
        We received a request to reset your HirePro password.
      </p>

      <p>
        Click the link below to reset your password:
      </p>

      <a href="${resetUrl}">
        Reset Password
      </a>

      <p>This link expires in 15 minutes.</p>

      <p>
        If you did not request this, you can safely ignore this email.
      </p>
    `,
  });
};
