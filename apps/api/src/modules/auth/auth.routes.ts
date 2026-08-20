import { validate } from "../../middlewares/validate.middleware";
import express from "express";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
} from "./auth.validation";
import {
  forgotPassword,
  getMe,
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
  resendVerification,
  resetPassword,
  verifyEmail,
} from "./auth.controller";
import protectedRoute from "../../middlewares/auth.middleware";
import {
  forgotPasswordRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  resendVerificationRateLimiter,
  resetPasswordRateLimiter,
} from "../../middlewares/rateLimit.middleware";

const authRouter = express.Router();

authRouter.post("/register", registerRateLimiter, validate(registerSchema), registerUser);
authRouter.post("/login", loginRateLimiter, validate(loginSchema), loginUser);
authRouter.get("/verify-email", verifyEmail);
authRouter.post(
  "/resend-verification",
  resendVerificationRateLimiter,
  validate(resendVerificationSchema),
  resendVerification,
);

authRouter.post(
  "/forgot-password",
  forgotPasswordRateLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);
authRouter.post(
  "/reset-password",
  resetPasswordRateLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);

authRouter.get("/me", protectedRoute, getMe);
authRouter.post("/logout", logoutUser);
authRouter.post("/refresh", refreshToken);

export default authRouter;
