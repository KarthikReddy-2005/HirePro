import { beforeEach, describe, expect, it, vi } from "vitest";

import ApiError from "../../../src/utils/ApiError";

import {
  createOrganisation,
  findOrganizationBySlug,
  findUserInOrganization,
} from "../../../src/modules/org/org.repository";

import { createOrganisationService } from "../../../src/modules/org/org.service";

vi.mock("../../../src/modules/org/org.repository", () => ({
  findOrganizationBySlug: vi.fn(),
  findUserInOrganization: vi.fn(),
  createOrganisation: vi.fn(),
}));

const mockedFindOrganizationBySlug = vi.mocked(findOrganizationBySlug);

const mockedFindUserInOrganization = vi.mocked(findUserInOrganization);

const mockedCreateOrganisation = vi.mocked(createOrganisation);

describe("createOrganisationService", () => {
  const userId = "user-123";

  const input = {
    name: "HirePro Technologies",
    slug: "hirepro-technologies",
    description: "AI-powered hiring platform",
  };

  const createdResult = {
    organization: {
      id: "organization-123",
      name: input.name,
      slug: input.slug,
      description: input.description,
      website: null,
      logoUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    organizationMember: {
      id: "membership-123",
      userId,
      organizationId: "organization-123",
      organizationRole: "OWNER" as const,
      joinedAt: new Date(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an organization when the slug and user are available", async () => {
    mockedFindOrganizationBySlug.mockResolvedValue(null);
    mockedFindUserInOrganization.mockResolvedValue(null);

    mockedCreateOrganisation.mockResolvedValue(createdResult);

    const result = await createOrganisationService(input, userId);

    expect(mockedFindOrganizationBySlug).toHaveBeenCalledOnce();

    expect(mockedFindOrganizationBySlug).toHaveBeenCalledWith(input.slug);

    expect(mockedFindUserInOrganization).toHaveBeenCalledWith(userId);

    expect(mockedCreateOrganisation).toHaveBeenCalledWith(input, userId);

    expect(result).toEqual(createdResult);
  });

  it("throws 409 when the slug already exists", async () => {
    mockedFindOrganizationBySlug.mockResolvedValue({
      id: "existing-organization",
      name: "Existing Organization",
      slug: input.slug,
      description: null,
      website: null,
      logoUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(createOrganisationService(input, userId)).rejects.toMatchObject({
      statusCode: 409,
      message: "Organization slug already exists",
    });

    expect(mockedFindUserInOrganization).not.toHaveBeenCalled();

    expect(mockedCreateOrganisation).not.toHaveBeenCalled();
  });

  it("throws 409 when the user already belongs to an organization", async () => {
    mockedFindOrganizationBySlug.mockResolvedValue(null);

    mockedFindUserInOrganization.mockResolvedValue({
      id: "membership-123",
      userId,
      organizationId: "organization-123",
      organizationRole: "OWNER",
      joinedAt: new Date(),
    });

    await expect(createOrganisationService(input, userId)).rejects.toMatchObject({
      statusCode: 409,
      message: "User already belongs to an organization",
    });

    expect(mockedCreateOrganisation).not.toHaveBeenCalled();
  });

  it("propagates repository errors", async () => {
    mockedFindOrganizationBySlug.mockRejectedValue(new Error("Database unavailable"));

    await expect(createOrganisationService(input, userId)).rejects.toThrow("Database unavailable");

    expect(mockedCreateOrganisation).not.toHaveBeenCalled();
  });

  it("returns an ApiError for duplicate slug", async () => {
    mockedFindOrganizationBySlug.mockResolvedValue({
      id: "existing-organization",
      name: "Existing Organization",
      slug: input.slug,
      description: null,
      website: null,
      logoUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      await createOrganisationService(input, userId);

      throw new Error("Expected service to reject");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
    }
  });
});
