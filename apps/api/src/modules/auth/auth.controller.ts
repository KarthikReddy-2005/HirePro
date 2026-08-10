import { Request, Response } from "express";
import ApiResponse from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";
import { loginService, registerService } from "./auth.service";
import { clearToken, generateToken } from "../../utils/manageToken";
import { env } from "../../config/env";

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const userData = await registerService(req.body);
  if (userData) {
    generateToken(userData.id, res);
    res.status(201).json(new ApiResponse(201, "User created successfully", userData));
  }
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const userData = await loginService(req.body);
  if (userData) {
    generateToken(userData.id, res);
    res.status(200).json(new ApiResponse(200, "User logged in successfully", userData));
  }
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, "User fetched successfully", req.user));
});

export const logoutUser = asyncHandler(async (_req: Request, res: Response) => {
  clearToken(res);
  res.status(200).json(new ApiResponse(200, "User logged out successfully"));
});