import { validate } from "../../middlewares/validate.middleware";
import express from "express";
import { loginSchema, registerSchema } from "./auth.validation";
import { getMe, loginUser, logoutUser, registerUser } from "./auth.controller";
import protectedRoute from "../../middlewares/auth.middleware";

const authRouter = express.Router();

authRouter.post("/register", validate(registerSchema), registerUser);
authRouter.post("/login", validate(loginSchema), loginUser);
authRouter.get("/me", protectedRoute, getMe);
authRouter.post("/logout", logoutUser);

export default authRouter;