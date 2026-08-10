import { Request, Response } from "express";

export const health = async (req: Request, res: Response): Promise<void> => {
  res.json({
    status: "ok",
    service: "HirePro API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};
