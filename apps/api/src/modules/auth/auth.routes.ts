import { validate } from "../../middlewares/validate.middleware";
import express from "express";
import { loginSchema, registerSchema } from "./auth.validation";
import { loginUser, registerUser } from "./auth.controller";

const authRouter = express.Router();

authRouter.post("/register", validate(registerSchema), registerUser);
authRouter.post("/login", validate(loginSchema), loginUser);

export default authRouter;