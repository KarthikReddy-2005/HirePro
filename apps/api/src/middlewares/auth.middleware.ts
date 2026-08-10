import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";
import { env } from "../config/env";
import { findUserById } from "../modules/auth/auth.repository";
import { Request } from "express";

interface JwtPayload {
  userId: string;
}

const protectedRoute = asyncHandler(async (req: Request, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    throw new ApiError(401, "Unauthorized! Access denied");
  }
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new ApiError(401, "Unauthorized! Access denied");
  }
  const { userId } = decoded;
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw new ApiError(401, "Unauthorized! Access denied");
  }
  req.user = existingUser;
  next();
});

export default protectedRoute;
