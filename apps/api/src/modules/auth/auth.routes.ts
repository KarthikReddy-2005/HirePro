import { validate } from "../../middlewares/validate.middleware";
import express from "express";
import { loginSchema, registerSchema } from "./auth.validation";
import { getMe, loginUser, logoutUser, registerUser, verifyEmail } from "./auth.controller";
import protectedRoute from "../../middlewares/auth.middleware";

const authRouter = express.Router();

authRouter.post("/register", validate(registerSchema), registerUser);
authRouter.post("/login", validate(loginSchema), loginUser);
authRouter.get("/me", protectedRoute, getMe);
authRouter.post("/logout", logoutUser);
authRouter.get("/verify-email", verifyEmail);

export default authRouter;