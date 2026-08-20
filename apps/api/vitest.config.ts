import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

process.env.NODE_ENV = "test";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.test"),
  override: true,
});

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    fileParallelism: false,
  },
});
