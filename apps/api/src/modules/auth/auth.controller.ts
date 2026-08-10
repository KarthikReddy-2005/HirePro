import { Request, Response } from "express";
import ApiResponse from "../../utils/ApiResponse";
import asyncHandler from "../../utils/asyncHandler";
import { registerService } from "./auth.service";

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const userData = await registerService(req.body);
  res.status(201).json(new ApiResponse(201, "User created successfully", userData));
});
export const loginUser = () => {};
