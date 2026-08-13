import ApiError from "../../utils/ApiError";
import bcrypt from "bcrypt";
import {
  createEmailVerification,
  createPasswordReset,
  createUser,
  findEmailVerificationByToken,
  findPasswordByEmail,
  findPasswordResetByToken,
  findRefreshTokenByHash,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  revokeRefreshToken,
  updateEmailVerification,
  updatePasswordReset,
} from "./auth.repository";
import { generateRandomToken, hashToken } from "../../utils/crypto";
import { sendResetPasswordEmail, sendVerificationEmail } from "./auth.email";

export const registerService = async (data: {
  username: string;
  displayName: string;
  email: string;
  password: string;
}) => {
  const { username, displayName, email, password } = data;
  const usernameExists = await findUserByUsername(username);
  if (usernameExists) {
    throw new ApiError(409, "Username already exist");
  }
  const emailExists = await findUserByEmail(email);
  if (emailExists) {
    throw new ApiError(409, "Email already exist");
  }
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = await createUser({ username, displayName, email, hashedPassword });

  const rawToken = generateRandomToken();

  const tokenHash = hashToken(rawToken);
  const userId = newUser.id;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await createEmailVerification({ userId, tokenHash, expiresAt });

  await sendVerificationEmail(newUser.email, rawToken);

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

  if (!verification || verification.usedAt || verification.expiresAt < new Date()) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  await updateEmailVerification(verification.userId, verification.id);
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