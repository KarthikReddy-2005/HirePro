import { z } from "zod";
import ApiError from "../utils/ApiError";
import { NextFunction, Request, Response } from "express";

export const validate = (schema: z.ZodType) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.reduce(
        (accumulator, issue) => {
          const field = issue.path.join(".");
          if (!accumulator[field]) {
            accumulator[field] = issue.message;
          }
          return accumulator;
        },
        {} as Record<string, string>,
      );
      throw new ApiError(400, "Validation failed", errors);
    }
    req.body = result.data;
    next();
  };
};
