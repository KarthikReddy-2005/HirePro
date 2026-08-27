import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { createOrganizationService } from "./org.service";
import ApiResponse from "../../utils/ApiResponse";

export const createOrganization = asyncHandler(async (req: Request, res: Response) => {
  const organisationData = await createOrganizationService(req.body, req.user!.id);
  res.status(201).json(new ApiResponse(201, "Organization created successfully", organisationData));
});
