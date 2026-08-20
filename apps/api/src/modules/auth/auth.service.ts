import ApiError from "../../utils/ApiError";
import {
  consumeEmailVerification,
  createEmailVerification,
  createPasswordReset,
  createUserWithEmailVerification,
  findEmailVerificationByToken,
  findPasswordByEmail,
  findPasswordResetByToken,
  findRefreshTokenByHash,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  findUserForVerification,
  invalidateEmailVerifications,
  resetUserPassword,
  revokeRefreshToken,
} from "./auth.repository";
import { generateRandomToken, hashToken } from "../../utils/crypto";
import { sendResetPasswordEmail, sendVerificationEmail } from "./auth.email";
import { isPrismaUniqueConstraintError } from "../../utils/prismaError";
import { logger } from "../../config/logger";
import { comparePassword, hashPassword } from "../../utils/password";

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

  const hashedPassword = await hashPassword(password);

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

  const passwordValid = await comparePassword(password, userData.hashedPassword);

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

export const resendVerificationService = async (email: string) => {
  const user = await findUserForVerification(email);

  if (!user || user.isEmailVerified) {
    return;
  }

  await invalidateEmailVerifications(user.id);

  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await createEmailVerification({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  try {
    await sendVerificationEmail(user.email, rawToken);
  } catch (error) {
    logger.error(
      {
        userId: user.id,
        email: user.email,
        error,
      },
      "Failed to send verification email",
    );

    throw new ApiError(500, "Unable to send verification email");
  }
};

export const forgotPasswordService = async (email: string) => {
  const user = await findUserByEmail(email);

  if (!user) {
    return;
  }

  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await createPasswordReset({
    tokenHash,
    userId: user.id,
    expiresAt,
  });

  try {
    await sendResetPasswordEmail(email, rawToken);
  } catch (error) {
    logger.error(
      {
        userId: user.id,
        email,
        error,
      },
      "Failed to send password reset email",
    );

    throw new ApiError(500, "Unable to send password reset email");
  }
};

export const resetPasswordService = async (token: string, password: string) => {
  const tokenHash = hashToken(token);

  const passwordReset = await findPasswordResetByToken(tokenHash);

  if (!passwordReset || passwordReset.usedAt || passwordReset.expiresAt <= new Date()) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  const hashedPassword = await hashPassword(password);

  await resetUserPassword(passwordReset.userId, hashedPassword);
};

export const refreshTokenService = async (refreshToken: string) => {
  const tokenHash = hashToken(refreshToken);

  const storedToken = await findRefreshTokenByHash(tokenHash);

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= new Date()) {
    throw new ApiError(401, "Invalid refresh token");
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
