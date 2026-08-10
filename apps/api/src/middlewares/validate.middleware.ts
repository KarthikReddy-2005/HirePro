import { z } from "zod";
import ApiError from "../utils/ApiError";
import { NextFunction, Request, Response } from "express";

export const validate = (schema: z.ZodType) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(400, "Validation failed");
    }
    req.body = result.data;
    next();
  };
};
