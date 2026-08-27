import request from "supertest";
import bcrypt from "bcrypt";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import app from "../../../src/app";

import { prisma } from "../../../src/config/prisma";
import { env } from "../../../src/config/env";

import { generateAccessToken } from "../../../src/utils/jwt";

import { cleanDatabase } from "../../setup";

describe("POST /api/v1/organizations/", () => {
  const organizationInput = {
    name: "HirePro Technologies",
    slug: "hirepro-technologies",
  };

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  const createVerifiedUser = async (
    overrides: Partial<{
      username: string;
      displayName: string;
      email: string;
      isEmailVerified: boolean;
    }> = {},
  ) => {
    const hashedPassword = await bcrypt.hash("Password123!", env.BCRYPT_SALT_ROUNDS);

    return prisma.user.create({
      data: {
        username: overrides.username ?? "organizationowner",
        displayName: overrides.displayName ?? "Organization Owner",
        email: overrides.email ?? "organizationowner@example.com",
        hashedPassword,
        isEmailVerified: overrides.isEmailVerified ?? true,
      },
    });
  };

  const getAuthCookie = (userId: string) => {
    const accessToken = generateAccessToken(userId);

    return `accessToken=${accessToken}`;
  };

  it("creates an organization and owner membership", async () => {
    const user = await createVerifiedUser();

    const response = await request(app)
      .post("/api/v1/organizations/")
      .set("Cookie", getAuthCookie(user.id))
      .send(organizationInput);

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 201,
      message: "Organization created successfully",
      data: {
        organization: {
          name: organizationInput.name,
          slug: organizationInput.slug,
        },
        organizationMember: {
          userId: user.id,
          organizationRole: "OWNER",
        },
      },
    });

    const organization = await prisma.organization.findUnique({
      where: {
        slug: organizationInput.slug,
      },
    });

    expect(organization).not.toBeNull();
    expect(organization?.name).toBe(organizationInput.name);

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        organizationId: organization?.id,
      },
    });

    expect(membership).not.toBeNull();
    expect(membership?.organizationRole).toBe("OWNER");
  });

  it("rejects an unauthenticated request", async () => {
    const response = await request(app).post("/api/v1/organizations/").send(organizationInput);

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
      message: "Unauthorized! Access denied",
    });

    const organizationCount = await prisma.organization.count();

    expect(organizationCount).toBe(0);
  });

  it("rejects an unverified user", async () => {
    const user = await createVerifiedUser({
      isEmailVerified: false,
    });

    const response = await request(app)
      .post("/api/v1/organizations/")
      .set("Cookie", getAuthCookie(user.id))
      .send(organizationInput);

    expect(response.status).toBe(401);

    expect(response.body.message).toBe("Unauthorized! Access denied");

    const organizationCount = await prisma.organization.count();

    expect(organizationCount).toBe(0);
  });

  it("rejects invalid organization input", async () => {
    const user = await createVerifiedUser();

    const response = await request(app)
      .post("/api/v1/organizations/")
      .set("Cookie", getAuthCookie(user.id))
      .send({
        name: "",
        slug: "Invalid Slug",
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: "Validation failed",
    });

    const organizationCount = await prisma.organization.count();

    expect(organizationCount).toBe(0);
  });

  it("rejects a duplicate organization slug", async () => {
    const firstUser = await createVerifiedUser();

    const secondUser = await createVerifiedUser({
      username: "secondowner",
      displayName: "Second Owner",
      email: "secondowner@example.com",
    });

    await prisma.organization.create({
      data: {
        name: "Existing Organization",
        slug: organizationInput.slug,
      },
    });

    const response = await request(app)
      .post("/api/v1/organizations/")
      .set("Cookie", getAuthCookie(secondUser.id))
      .send(organizationInput);

    expect(response.status).toBe(409);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 409,
      message: "Organization slug already exists",
    });

    const organizations = await prisma.organization.findMany({
      where: {
        slug: organizationInput.slug,
      },
    });

    expect(organizations).toHaveLength(1);

    // Prevent unused-variable warnings if your linter checks them.
    expect(firstUser.id).toBeDefined();
  });

  it("rejects a user who already belongs to an organization", async () => {
    const user = await createVerifiedUser();

    const existingOrganization = await prisma.organization.create({
      data: {
        name: "Existing Company",
        slug: "existing-company",
      },
    });

    await prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: existingOrganization.id,
        organizationRole: "OWNER",
      },
    });

    const response = await request(app)
      .post("/api/v1/organizations/")
      .set("Cookie", getAuthCookie(user.id))
      .send(organizationInput);

    expect(response.status).toBe(409);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 409,
      message: "User already belongs to an organization",
    });

    const newOrganization = await prisma.organization.findUnique({
      where: {
        slug: organizationInput.slug,
      },
    });

    expect(newOrganization).toBeNull();
  });

  it("stores optional organization fields", async () => {
    const user = await createVerifiedUser();

    const data = {
      ...organizationInput,
      description: "AI-powered hiring platform",
      website: "https://hirepro.example.com",
      logoUrl: "https://hirepro.example.com/logo.png",
    };

    const response = await request(app)
      .post("/api/v1/organizations/")
      .set("Cookie", getAuthCookie(user.id))
      .send(data);

    expect(response.status).toBe(201);

    expect(response.body.data.organization).toMatchObject({
      name: data.name,
      slug: data.slug,
      description: data.description,
      website: data.website,
      logoUrl: data.logoUrl,
    });
  });
});
