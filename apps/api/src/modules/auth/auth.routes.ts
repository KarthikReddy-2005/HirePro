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
  registerUser,
  resetPassword,
  verifyEmail,
} from "./auth.controller";
import protectedRoute from "../../middlewares/auth.middleware";

const authRouter = express.Router();

authRouter.post("/register", validate(registerSchema), registerUser);
authRouter.post("/login", validate(loginSchema), loginUser);
authRouter.get("/me", protectedRoute, getMe);
authRouter.post("/logout", logoutUser);
authRouter.get("/verify-email", verifyEmail);
authRouter.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", validate(resetPasswordSchema), resetPassword);

export default authRouter;