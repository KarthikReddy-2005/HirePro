import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: "15m",
  });
};
