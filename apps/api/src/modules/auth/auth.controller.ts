import { Request, Response } from "express";
import ApiResponse from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";
import {
  forgotPasswordService,
  loginService,
  PasswordResetService,
  registerService,
  verifyEmailService,
} from "./auth.service";
import { clearJwtToken, generateJwtToken } from "../../utils/jwt";

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const userData = await registerService(req.body);
  if (userData) {
    generateJwtToken(userData.id, res);
    res.status(201).json(new ApiResponse(201, "User created successfully", userData));
  }
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const userData = await loginService(req.body);
  if (userData) {
    generateJwtToken(userData.id, res);
    res.status(200).json(new ApiResponse(200, "User logged in successfully", userData));
  }
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, "User fetched successfully", req.user));
});

export const logoutUser = asyncHandler(async (_req: Request, res: Response) => {
  clearJwtToken(res);
  res.status(200).json(new ApiResponse(200, "User logged out successfully"));
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || Array.isArray(token) || typeof token !== "string") {
    return res.status(400).json({ message: "Invalid token" });
  }

  await verifyEmailService(token);

  res.status(200).json(new ApiResponse(200, "Email verified successfully"));
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
    return res.status(400).json({ message: "Invalid token" });
  }

  await PasswordResetService(token, password);

  res.status(200).json(new ApiResponse(200, "Password reseted successfully"));
});