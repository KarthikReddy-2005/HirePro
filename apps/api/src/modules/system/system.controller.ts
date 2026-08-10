import { Request, Response } from "express";
import ApiResponse from "../../utils/ApiResponse";

export const health = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json(
    new ApiResponse(200, "HirePro API", {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  );
};
