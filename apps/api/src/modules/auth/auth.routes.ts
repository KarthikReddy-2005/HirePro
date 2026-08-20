import { validate } from "../../middlewares/validate.middleware";
import express from "express";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.validation";
import {
  forgotPassword,
  getMe,
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
  resetPassword,
  verifyEmail,
} from "./auth.controller";
import protectedRoute from "../../middlewares/auth.middleware";
import { loginRateLimiter, registerRateLimiter } from "../../middlewares/rateLimit.middleware";

const authRouter = express.Router();

authRouter.post("/register", registerRateLimiter, validate(registerSchema), registerUser);
authRouter.post("/login", loginRateLimiter, validate(loginSchema), loginUser);
authRouter.get("/me", protectedRoute, getMe);
authRouter.post("/logout", logoutUser);
authRouter.get("/verify-email", verifyEmail);
authRouter.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", validate(resetPasswordSchema), resetPassword);
authRouter.post("/refresh", refreshToken);

export default authRouter;
