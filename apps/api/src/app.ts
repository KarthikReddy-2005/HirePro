import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";

import { logger } from "./config/logger";
import router from "./routes";

const app = express();

app.use(pinoHttp({ logger }));

app.use(helmet());

app.use(cors());

app.use(compression());

app.use(express.json());

app.use("/api/v1", router);

export default app;
