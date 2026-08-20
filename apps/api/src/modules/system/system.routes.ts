import { Router } from "express";
import { health } from "./system.controller";

const systemRouter = Router();

systemRouter.get("/", health);

export default systemRouter;
