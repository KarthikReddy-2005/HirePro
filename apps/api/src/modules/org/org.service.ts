import ApiError from "../../utils/ApiError";

import {
  createOrganization,
  type CreateOrganizationData,
  findOrganizationBySlug,
  findUserInOrganization,
} from "./org.repository";

export const createOrganizationService = async (data: CreateOrganizationData, userId: string) => {
  const slugExists = await findOrganizationBySlug(data.slug);

  if (slugExists) {
    throw new ApiError(409, "Organization slug already exists");
  }

  const existingMembership = await findUserInOrganization(userId);

  if (existingMembership) {
    throw new ApiError(409, "User already belongs to an organization");
  }

  return createOrganization(data, userId);
};
