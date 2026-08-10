import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";

import { logger } from "./config/logger";
import errorMiddleware from "./middlewares/error.middleware";
import ApiError from "./utils/ApiError";
import { env } from "./config/env";
import systemRouter from "./modules/system/system.routes";
import authRouter from "./modules/auth/auth.routes";

const app = express();

app.use(pinoHttp({ logger }));

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(compression());

app.use(express.json());

app.use("/api/v1", systemRouter);
app.use("/api/v1/auth", authRouter);

app.use((req, res, next) => {
  next(new ApiError(404, "Route not found"));
});

app.use(errorMiddleware);

export default app;
