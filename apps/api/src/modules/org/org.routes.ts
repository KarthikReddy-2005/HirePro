import express from "express";
import protectedRoute from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createOrganization } from "./org.controller";
import { createOrganizationSchema } from "./org.validatation";

const orgRouter = express.Router();

orgRouter.post("/", protectedRoute, validate(createOrganizationSchema), createOrganization);

export default orgRouter;
