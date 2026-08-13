import { sendEmail } from "../../services/email.service";

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `http://localhost:5000/api/v1/auth/verify-email?token=${token}`;

  return sendEmail({
    to: email,
    subject: "Verify your HirePro email",
    html: `
      <h1>Verify your email</h1>

      <p>Thanks for registering with HirePro.</p>

      <p>
        Click the link below to verify your email:
      </p>

      <a href="${verificationUrl}">
        Verify Email
      </a>

      <p>This link expires in 15 minutes.</p>
    `,
  });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const verificationUrl = `http://localhost:5000/api/v1/auth/reset-password?token=${token}`;

  return sendEmail({
    to: email,
    subject: "Reset your password",
    html: `
      <h1>Reset your password</h1>

      <p>
        Click the link below to Reset your password:
      </p>

      <a href="${verificationUrl}">
        Reset password
      </a>

      <p>This link expires in 15 minutes.</p>
    `,
  });
};
