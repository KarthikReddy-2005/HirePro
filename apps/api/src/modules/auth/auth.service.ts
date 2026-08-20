import ApiError from "../../utils/ApiError";
import bcrypt from "bcrypt";
import {
  consumeEmailVerification,
  createPasswordReset,
  createUserWithEmailVerification,
  findEmailVerificationByToken,
  findPasswordByEmail,
  findPasswordResetByToken,
  findRefreshTokenByHash,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  revokeRefreshToken,
  updatePasswordReset,
} from "./auth.repository";
import { generateRandomToken, hashToken } from "../../utils/crypto";
import { sendResetPasswordEmail, sendVerificationEmail } from "./auth.email";
import { isPrismaUniqueConstraintError } from "../../utils/prismaError";
import { logger } from "../../config/logger";
import { env } from "../../config/env";

export const registerService = async (data: {
  username: string;
  displayName: string;
  email: string;
  password: string;
}) => {
  const { username, displayName, email, password } = data;

  const usernameExists = await findUserByUsername(username);

  if (usernameExists) {
    throw new ApiError(409, "Username already exists");
  }

  const emailExists = await findUserByEmail(email);

  if (emailExists) {
    throw new ApiError(409, "Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  let newUser;

  try {
    newUser = await createUserWithEmailVerification({
      username,
      displayName,
      email,
      hashedPassword,
      tokenHash,
      expiresAt,
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new ApiError(409, "Username or email already exists");
    }
    throw error;
  }

  try {
    await sendVerificationEmail(email, rawToken);
  } catch (error) {
    logger.error(
      {
        error,
        userId: newUser.id,
      },
      "Failed to send verification email",
    );
  }
  return newUser;
};

export const loginService = async (data: { email: string; password: string }) => {
  const { email, password } = data;

  const userData = await findPasswordByEmail(email);

  if (!userData) {
    throw new ApiError(401, "Invalid email or password");
  }

  const passwordValid = await bcrypt.compare(password, userData.hashedPassword);

  if (!passwordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!userData.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  const user = await findUserById(userData.id);

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  return user;
};

export const verifyEmailService = async (token: string) => {
  const tokenHash = hashToken(token);

  const verification = await findEmailVerificationByToken(tokenHash);

  if (!verification) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  await consumeEmailVerification(verification.userId, verification.id);
};

export const forgotPasswordService = async (email: string) => {
  const userWithEmailExists = await findUserByEmail(email);
  if (!userWithEmailExists) {
    throw new ApiError(400, "If an account exists with this email, a reset link has been sent.");
  }

  const rawToken = generateRandomToken();

  const tokenHash = hashToken(rawToken);
  const userId = userWithEmailExists.id;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await createPasswordReset({ tokenHash, userId, expiresAt });

  await sendResetPasswordEmail(email, rawToken);
};

export const PasswordResetService = async (token: string, password: string) => {
  const newHashToken = hashToken(token);

  const passwordReset = await findPasswordResetByToken(newHashToken);

  if (!passwordReset || passwordReset.usedAt || passwordReset.expiresAt < new Date()) {
    throw new ApiError(400, "Invalid or expired reset password token");
  }

  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  await updatePasswordReset(passwordReset.userId, passwordReset.id, hashedPassword);
};

export const refreshTokenService = async (refreshToken: string) => {
  const tokenHash = hashToken(refreshToken);

  const storedToken = await findRefreshTokenByHash(tokenHash);

  if (!storedToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (storedToken.revokedAt) {
    throw new ApiError(401, "Refresh token has been revoked");
  }

  if (storedToken.expiresAt < new Date()) {
    throw new ApiError(401, "Refresh token has expired");
  }

  const user = await findUserById(storedToken.userId);

  if (!user || !user.isEmailVerified) {
    throw new ApiError(401, "Unauthorized");
  }

  return user;
};

export const logoutService = async (refreshToken: string) => {
  const tokenHash = hashToken(refreshToken);

  const storedToken = await findRefreshTokenByHash(tokenHash);

  if (storedToken) {
    await revokeRefreshToken(storedToken.id);
  }
};