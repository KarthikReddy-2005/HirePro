import ApiError from "../../utils/ApiError";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  createEmailVerification,
  createUser,
  findEmailVerificationByToken,
  findPasswordByEmail,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  updateEmailVerification,
} from "./auth.repository";
import { generateRandomToken, hashToken } from "../../utils/crypto";
import { env } from "../../config/env";
import { sendEmail } from "../../services/email.service";

export const registerService = async (data: {
  username: string;
  displayName: string;
  email: string;
  password: string;
}) => {
  const { username, displayName, email, password } = data;
  const usernameExists = await findUserByUsername(username);
  if (usernameExists) {
    throw new ApiError(409, "Username is not available");
  }
  const emailExists = await findUserByEmail(email);
  if (emailExists) {
    throw new ApiError(409, "User with this email already exist");
  }
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = await createUser({ username, displayName, email, hashedPassword });

  const rawToken = generateRandomToken();

  const tokenHash = hashToken(rawToken);
  const userId = newUser.id;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await createEmailVerification({ userId, tokenHash, expiresAt });

  const verificationUrl = `http://localhost:5000/api/v1/auth/verify-email?token=${rawToken}`;

  await sendEmail({
    to: newUser.email,
    subject: "Verify your HirePro email",
    html: `
    <h2>Welcome to HirePro</h2>
      <p>Please verify your email address.</p>

      <a href="${verificationUrl}">
        Verify Email
      </a>

      <p>This link expires in 15 minutes.</p>
    `,
  });
  return newUser;
};

export const loginService = async (data: { email: string; password: string }) => {
  const { email, password } = data;
  const userData = await findPasswordByEmail(email);
  if (!userData) {
    throw new ApiError(400, "Invalid credentials");
  }
  const checkPassword = await bcrypt.compare(password, userData.hashedPassword);

  if (!checkPassword) {
    throw new ApiError(400, "Invalid credentials");
  }

  return await findUserById(userData.id);
};

export const verifyEmailService = async (token: string) => {
  const newHashToken = hashToken(token);

  const verification = await findEmailVerificationByToken(newHashToken);

  if (!verification) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  if (verification.usedAt) {
    throw new ApiError(400, "Verification token has already been used");
  }

  if (verification.expiresAt < new Date()) {
    throw new ApiError(400, "Verification token has been expired");
  }

  await updateEmailVerification(verification.userId, verification.id);
};