import express from "express";
import protectedRoute from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createOrganisation } from "./org.controller";
import { createOrganisationSchema } from "./org.validatation";

const orgRouter = express.Router();

orgRouter.post("/create", protectedRoute, validate(createOrganisationSchema), createOrganisation);

export default orgRouter;
