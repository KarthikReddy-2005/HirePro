import { Response } from "express";
import { generateAccessToken } from "./jwt";
import { generateRandomToken, hashToken } from "./crypto";
import { createRefreshToken } from "../modules/auth/auth.repository";
import { env } from "../config/env";

export const generateAuthTokens = async (userId: string, res: Response) => {
  const accessToken = generateAccessToken(userId);

  const refreshToken = generateRandomToken();
  const refreshTokenHash = hashToken(refreshToken);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await createRefreshToken({
    userId,
    tokenHash: refreshTokenHash,
    expiresAt,
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
    path: "/api/v1",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/v1",
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1",
  });
};
