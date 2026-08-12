import { sendEmail } from "../../services/email.service";

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;

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

      <p>This link will expire soon.</p>
    `,
  });
};
