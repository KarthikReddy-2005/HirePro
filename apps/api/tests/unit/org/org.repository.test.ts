import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../src/config/prisma";

import {
  createOrganization,
  findOrganizationBySlug,
  findUserInOrganization,
} from "../../../src/modules/org/org.repository";

vi.mock("../../../src/config/prisma", () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
    },

    organizationMember: {
      findFirst: vi.fn(),
    },

    $transaction: vi.fn(),
  },
}));

const mockedPrisma = vi.mocked(prisma, {
  deep: true,
});

describe("organization repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findOrganizationBySlug", () => {
    it("finds an organization using its slug", async () => {
      const organization = {
        id: "organization-123",
        name: "HirePro Technologies",
        slug: "hirepro-technologies",
        description: null,
        website: null,
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedPrisma.organization.findUnique.mockResolvedValue(organization);

      const result = await findOrganizationBySlug("hirepro-technologies");

      expect(mockedPrisma.organization.findUnique).toHaveBeenCalledWith({
        where: {
          slug: "hirepro-technologies",
        },
      });

      expect(result).toEqual(organization);
    });

    it("returns null when the slug does not exist", async () => {
      mockedPrisma.organization.findUnique.mockResolvedValue(null);

      const result = await findOrganizationBySlug("missing-organization");

      expect(result).toBeNull();
    });
  });

  describe("findUserInOrganization", () => {
    it("finds membership using the userId field", async () => {
      const membership = {
        id: "membership-123",
        userId: "user-123",
        organizationId: "organization-123",
        organizationRole: "OWNER" as const,
        joinedAt: new Date(),
      };

      mockedPrisma.organizationMember.findFirst.mockResolvedValue(membership);

      const result = await findUserInOrganization("user-123");

      expect(mockedPrisma.organizationMember.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
        },
      });

      expect(result).toEqual(membership);
    });
  });

  describe("createOrganisation", () => {
    it("creates the organization and owner membership in one transaction", async () => {
      const input = {
        name: "HirePro Technologies",
        slug: "hirepro-technologies",
        description: "AI hiring platform",
      };

      const userId = "user-123";

      const organization = {
        id: "organization-123",
        name: input.name,
        slug: input.slug,
        description: input.description,
        website: null,
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const organizationMember = {
        id: "membership-123",
        userId,
        organizationId: organization.id,
        organizationRole: "OWNER" as const,
        joinedAt: new Date(),
      };

      const tx = {
        organization: {
          create: vi.fn().mockResolvedValue(organization),
        },

        organizationMember: {
          create: vi.fn().mockResolvedValue(organizationMember),
        },
      };

      mockedPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(tx as never);
      });

      const result = await createOrganization(input, userId);

      expect(mockedPrisma.$transaction).toHaveBeenCalledOnce();

      expect(tx.organization.create).toHaveBeenCalledWith({
        data: input,
      });

      expect(tx.organizationMember.create).toHaveBeenCalledWith({
        data: {
          userId,
          organizationId: organization.id,
          organizationRole: "OWNER",
        },
      });

      expect(result).toEqual({
        organization,
        organizationMember,
      });
    });

    it("does not create membership when organization creation fails", async () => {
      const input = {
        name: "HirePro Technologies",
        slug: "hirepro-technologies",
      };

      const tx = {
        organization: {
          create: vi.fn().mockRejectedValue(new Error("Organization creation failed")),
        },

        organizationMember: {
          create: vi.fn(),
        },
      };

      mockedPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(tx as never);
      });

      await expect(createOrganization(input, "user-123")).rejects.toThrow(
        "Organization creation failed",
      );

      expect(tx.organizationMember.create).not.toHaveBeenCalled();
    });

    it("rejects when membership creation fails", async () => {
      const input = {
        name: "HirePro Technologies",
        slug: "hirepro-technologies",
      };

      const organization = {
        id: "organization-123",
        name: input.name,
        slug: input.slug,
        description: null,
        website: null,
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tx = {
        organization: {
          create: vi.fn().mockResolvedValue(organization),
        },

        organizationMember: {
          create: vi.fn().mockRejectedValue(new Error("Membership creation failed")),
        },
      };

      mockedPrisma.$transaction.mockImplementation(async (callback) => {
        return callback(tx as never);
      });

      await expect(createOrganization(input, "user-123")).rejects.toThrow(
        "Membership creation failed",
      );

      expect(tx.organization.create).toHaveBeenCalled();
      expect(tx.organizationMember.create).toHaveBeenCalled();
    });
  });
});
