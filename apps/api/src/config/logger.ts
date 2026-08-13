import pino from "pino";

const opts: pino.LoggerOptions = { level: "info" };

if (process.env.NODE_ENV !== "production") {
  // transport types are strict; assert as any for pino-pretty dev config
  (opts as any).transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  };
}

export const logger = pino(opts);
