import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/ApiError";

const errorMiddleware = (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  console.error("Error:", {
    error: err,
    method: req.method,
    url: req.originalUrl,
    params: req.params,
  });

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      data: err.data,
    });

    return;
  }

  res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Something went wrong",
    data: null,
  });
};

export default errorMiddleware;
