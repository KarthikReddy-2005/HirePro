import express from "express";

const router = express.Router();

router.get("/health", (_, res) => {
  res.json({
    status: "ok",
    service: "HirePro API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
