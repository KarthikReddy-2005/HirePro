// tests/unit/org/org.repository.test.ts

import type { Prisma } from "@prisma/client";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../src/config/prisma";

import {
  createOrganization,
  findOrganizationBySlug,
  findOrganizationByUserId,
  findUserInOrganization,
} from "../../../src/modules/org/org.repository";

describe("organization repository", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("findOrganizationBySlug", () => {
    it("finds an organization by slug", async () => {
      const organization = {
        id: "organization-1",
        name: "HirePro Technologies",
        slug: "hirepro-technologies",
        description: null,
        website: null,
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const findUniqueSpy = vi
        .spyOn(prisma.organization, "findUnique")
        .mockResolvedValue(organization);

      const result = await findOrganizationBySlug("hirepro-technologies");

      expect(findUniqueSpy).toHaveBeenCalledWith({
        where: {
          slug: "hirepro-technologies",
        },
      });

      expect(result).toEqual(organization);
    });

    it("returns null when the slug does not exist", async () => {
      vi.spyOn(prisma.organization, "findUnique").mockResolvedValue(null);

      const result = await findOrganizationBySlug("missing-organization");

      expect(result).toBeNull();
    });

    it("propagates database errors", async () => {
      vi.spyOn(prisma.organization, "findUnique").mockRejectedValue(
        new Error("Database unavailable"),
      );

      await expect(findOrganizationBySlug("hirepro")).rejects.toThrow("Database unavailable");
    });
  });

  describe("findUserInOrganization", () => {
    it("finds membership by user id", async () => {
      const membership = {
        id: "membership-1",
        userId: "user-1",
        organizationId: "organization-1",
        organizationRole: "OWNER" as const,
        joinedAt: new Date(),
      };

      const findFirstSpy = vi
        .spyOn(prisma.organizationMember, "findFirst")
        .mockResolvedValue(membership);

      const result = await findUserInOrganization("user-1");

      expect(findFirstSpy).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
        },
      });

      expect(result).toEqual(membership);
    });

    it("returns null when the user has no membership", async () => {
      vi.spyOn(prisma.organizationMember, "findFirst").mockResolvedValue(null);

      const result = await findUserInOrganization("user-1");

      expect(result).toBeNull();
    });
  });

  describe("findOrganizationByUserId", () => {
    it("returns the organization through the user's membership", async () => {
      const resultData = {
        organizationRole: "OWNER" as const,
        joinedAt: new Date(),
        organization: {
          id: "organization-1",
          name: "HirePro Technologies",
          slug: "hirepro-technologies",
          description: null,
          website: null,
          logoUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const findFirstSpy = vi
        .spyOn(prisma.organizationMember, "findFirst")
        .mockResolvedValue(resultData as never);

      const result = await findOrganizationByUserId("user-1");

      expect(findFirstSpy).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
        },
        select: {
          organizationRole: true,
          joinedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              logoUrl: true,
              website: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      expect(result).toEqual(resultData);
    });

    it("returns null when the user has no organization", async () => {
      vi.spyOn(prisma.organizationMember, "findFirst").mockResolvedValue(null);

      const result = await findOrganizationByUserId("user-1");

      expect(result).toBeNull();
    });
  });

  describe("createOrganization", () => {
    it("creates the organization and membership inside one transaction", async () => {
      const input = {
        name: "HirePro Technologies",
        slug: "hirepro-technologies",
        description: "AI-powered hiring platform",
      };

      const userId = "user-1";

      const organization = {
        id: "organization-1",
        name: input.name,
        slug: input.slug,
        description: input.description,
        website: null,
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const organizationMember = {
        id: "membership-1",
        userId,
        organizationId: organization.id,
        organizationRole: "OWNER" as const,
        joinedAt: new Date(),
      };

      const organizationCreateMock = vi.fn().mockResolvedValue(organization);

      const membershipCreateMock = vi.fn().mockResolvedValue(organizationMember);

      const transactionClient = {
        organization: {
          create: organizationCreateMock,
        },
        organizationMember: {
          create: membershipCreateMock,
        },
      } as unknown as Prisma.TransactionClient;

      const transactionSpy = vi.spyOn(prisma, "$transaction");

      transactionSpy.mockImplementation((async (
        callback: (transaction: Prisma.TransactionClient) => Promise<unknown>,
      ) => callback(transactionClient)) as never);

      const result = await createOrganization(input, userId);

      expect(transactionSpy).toHaveBeenCalledOnce();

      expect(organizationCreateMock).toHaveBeenCalledWith({
        data: input,
      });

      expect(membershipCreateMock).toHaveBeenCalledWith({
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
      const organizationCreateMock = vi
        .fn()
        .mockRejectedValue(new Error("Organization creation failed"));

      const membershipCreateMock = vi.fn();

      const transactionClient = {
        organization: {
          create: organizationCreateMock,
        },
        organizationMember: {
          create: membershipCreateMock,
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementation((async (
        callback: (transaction: Prisma.TransactionClient) => Promise<unknown>,
      ) => callback(transactionClient)) as never);

      await expect(
        createOrganization(
          {
            name: "HirePro",
            slug: "hirepro",
          },
          "user-1",
        ),
      ).rejects.toThrow("Organization creation failed");

      expect(membershipCreateMock).not.toHaveBeenCalled();
    });

    it("rejects when membership creation fails", async () => {
      const organization = {
        id: "organization-1",
        name: "HirePro",
        slug: "hirepro",
        description: null,
        website: null,
        logoUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const organizationCreateMock = vi.fn().mockResolvedValue(organization);

      const membershipCreateMock = vi
        .fn()
        .mockRejectedValue(new Error("Membership creation failed"));

      const transactionClient = {
        organization: {
          create: organizationCreateMock,
        },
        organizationMember: {
          create: membershipCreateMock,
        },
      } as unknown as Prisma.TransactionClient;

      vi.spyOn(prisma, "$transaction").mockImplementation((async (
        callback: (transaction: Prisma.TransactionClient) => Promise<unknown>,
      ) => callback(transactionClient)) as never);

      await expect(
        createOrganization(
          {
            name: "HirePro",
            slug: "hirepro",
          },
          "user-1",
        ),
      ).rejects.toThrow("Membership creation failed");

      expect(organizationCreateMock).toHaveBeenCalledOnce();
      expect(membershipCreateMock).toHaveBeenCalledOnce();
    });
  });
});
