import { prisma } from "../../config/prisma";

export interface CreateOrganizationData {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logoUrl?: string;
}

export const findOrganizationBySlug = async (slug: string) => {
  return prisma.organization.findUnique({
    where: {
      slug,
    },
  });
};

export const findUserInOrganization = async (userId: string) => {
  return prisma.organizationMember.findFirst({
    where: {
      userId,
    },
  });
};

export const createOrganization = async (data: CreateOrganizationData, userId: string) => {
  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data,
    });

    const organizationMember = await tx.organizationMember.create({
      data: {
        userId,
        organizationId: organization.id,
        organizationRole: "OWNER",
      },
    });

    return {
      organization,
      organizationMember,
    };
  });
};
