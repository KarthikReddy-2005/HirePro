import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { createOrganisationService } from "./org.service";
import ApiResponse from "../../utils/ApiResponse";

export const createOrganisation = asyncHandler(async (req: Request, res: Response) => {
  const organisationData = await createOrganisationService(req.body, req.user!.id);
  res.status(201).json(new ApiResponse(201, "Organization created successfully", organisationData));
});
