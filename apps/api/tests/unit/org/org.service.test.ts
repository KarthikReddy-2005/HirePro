// tests/unit/org/org.service.test.ts

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createOrganization,
  findOrganizationBySlug,
  findOrganizationByUserId,
  findUserInOrganization,
} from "../../../src/modules/org/org.repository";

import {
  createOrganizationService,
  getMyOrganizationService,
} from "../../../src/modules/org/org.service";

vi.mock("../../../src/modules/org/org.repository", () => ({
  createOrganization: vi.fn(),
  findOrganizationBySlug: vi.fn(),
  findOrganizationByUserId: vi.fn(),
  findUserInOrganization: vi.fn(),
}));

describe("organization service", () => {
  const userId = "user-1";

  const input = {
    name: "HirePro Technologies",
    slug: "hirepro-technologies",
    description: "AI-powered hiring platform",
    website: "https://hirepro.example.com",
    logoUrl: "https://hirepro.example.com/logo.png",
  };

  const organization = {
    id: "organization-1",
    ...input,
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

  const organizationMembershipResult = {
    organizationRole: "OWNER" as const,
    joinedAt: organizationMember.joinedAt,
    organization,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createOrganizationService", () => {
    it("creates an organization when the slug and membership are available", async () => {
      vi.mocked(findOrganizationBySlug).mockResolvedValue(null);

      vi.mocked(findUserInOrganization).mockResolvedValue(null);

      vi.mocked(createOrganization).mockResolvedValue({
        organization,
        organizationMember,
      });

      const result = await createOrganizationService(input, userId);

      expect(findOrganizationBySlug).toHaveBeenCalledWith(input.slug);

      expect(findUserInOrganization).toHaveBeenCalledWith(userId);

      expect(createOrganization).toHaveBeenCalledWith(input, userId);

      expect(result).toEqual({
        organization,
        organizationMember,
      });
    });

    it("throws 409 when the slug already exists", async () => {
      vi.mocked(findOrganizationBySlug).mockResolvedValue(organization);

      await expect(createOrganizationService(input, userId)).rejects.toMatchObject({
        statusCode: 409,
        message: "Organization slug already exists",
      });

      expect(findUserInOrganization).not.toHaveBeenCalled();

      expect(createOrganization).not.toHaveBeenCalled();
    });

    it("throws 409 when the user already belongs to an organization", async () => {
      vi.mocked(findOrganizationBySlug).mockResolvedValue(null);

      vi.mocked(findUserInOrganization).mockResolvedValue(organizationMember);

      await expect(createOrganizationService(input, userId)).rejects.toMatchObject({
        statusCode: 409,
        message: "User already belongs to an organization",
      });

      expect(createOrganization).not.toHaveBeenCalled();
    });

    it("propagates repository errors", async () => {
      vi.mocked(findOrganizationBySlug).mockRejectedValue(new Error("Database unavailable"));

      await expect(createOrganizationService(input, userId)).rejects.toThrow(
        "Database unavailable",
      );

      expect(createOrganization).not.toHaveBeenCalled();
    });
  });

  describe("getMyOrganizationService", () => {
    it("returns the organization and current membership details", async () => {
      vi.mocked(findOrganizationByUserId).mockResolvedValue(organizationMembershipResult);

      const result = await getMyOrganizationService(userId);

      expect(findOrganizationByUserId).toHaveBeenCalledWith(userId);

      expect(result).toEqual({
        ...organization,
        membership: {
          role: organizationMember.organizationRole,
          joinedAt: organizationMember.joinedAt,
        },
      });
    });

    it("throws 404 when the user has no organization", async () => {
      vi.mocked(findOrganizationByUserId).mockResolvedValue(null);

      await expect(getMyOrganizationService(userId)).rejects.toMatchObject({
        statusCode: 404,
        message: "User does not belong to an organization",
      });
    });

    it("propagates repository errors", async () => {
      vi.mocked(findOrganizationByUserId).mockRejectedValue(
        new Error("Organization lookup failed"),
      );

      await expect(getMyOrganizationService(userId)).rejects.toThrow("Organization lookup failed");
    });
  });
});
