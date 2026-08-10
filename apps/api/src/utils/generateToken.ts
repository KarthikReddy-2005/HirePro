import { Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

const generateToken = (userId: string, res: Response) => {
  const token = jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "1d" });

  res.cookie("token", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  });
};

export default generateToken;
