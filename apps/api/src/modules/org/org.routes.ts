import express from "express";
import protectedRoute from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createOrganization, getMyOrganization } from "./org.controller";
import { createOrganizationSchema } from "./org.validation";

const orgRouter = express.Router();

orgRouter.post("/", protectedRoute, validate(createOrganizationSchema), createOrganization);
orgRouter.get("/me", protectedRoute, getMyOrganization);

export default orgRouter;
