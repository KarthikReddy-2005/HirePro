import { Request, Response } from "express";
import ApiResponse from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";
import {
  forgotPasswordService,
  loginService,
  logoutService,
  PasswordResetService,
  refreshTokenService,
  registerService,
  resendVerificationService,
  verifyEmailService,
} from "./auth.service";
import { clearAuthCookies, generateAuthTokens } from "../../utils/authTokens";
import { env } from "../../config/env";
import ApiError from "../../utils/ApiError";
import { generateAccessToken } from "../../utils/jwt";
import { verificationTokenSchema } from "./auth.validation";

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const userData = await registerService(req.body);
  res
    .status(201)
    .json(new ApiResponse(201, "Account created. Please verify your email.", userData));
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const userData = await loginService(req.body);
  await generateAuthTokens(userData.id, res);
  res.status(200).json(new ApiResponse(200, "User logged in successfully", userData));
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, "User fetched successfully", req.user));
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await logoutService(refreshToken);
  }

  clearAuthCookies(res);

  res.status(200).json(new ApiResponse(200, "User logged out successfully"));
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const parsedToken = verificationTokenSchema.safeParse(req.query.token);

  if (!parsedToken.success) {
    throw new ApiError(400, "Invalid verification token");
  }

  await verifyEmailService(parsedToken.data);

  res.status(200).json(new ApiResponse(200, "Email verified successfully"));
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  await resendVerificationService(req.body.email);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "If the account exists and is not verified, a verification email has been sent.",
      ),
    );
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  await forgotPasswordService(email);
  res
    .status(200)
    .json(
      new ApiResponse(200, "If an account exists with this email, a reset link has been sent."),
    );
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;
  const { password } = req.body;

  if (!token || Array.isArray(token) || typeof token !== "string") {
    throw new ApiError(401, "Token is required");
  }

  await PasswordResetService(token, password);

  res.status(200).json(new ApiResponse(200, "Password reseted successfully"));
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    throw new ApiError(401, "Refresh token is required");
  }

  const user = await refreshTokenService(token);

  const accessToken = generateAccessToken(user.id);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  res.status(200).json(new ApiResponse(200, "Access token refreshed successfully"));
});