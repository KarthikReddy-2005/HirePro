// tests/integration/org/organization.route.test.ts

import request from "supertest";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import app from "../../../src/app";
import { prisma } from "../../../src/config/prisma";

import { generateAccessToken } from "../../../src/utils/jwt";

import { cleanDatabase } from "../../setup";

describe("organization routes", () => {
  const organizationInput = {
    name: "HirePro Technologies",
    slug: "hirepro-technologies",
    description: "AI-powered hiring platform",
    website: "https://hirepro.example.com",
    logoUrl: "https://hirepro.example.com/logo.png",
  };

  const createUser = async (
    overrides: Partial<{
      username: string;
      displayName: string;
      email: string;
      isEmailVerified: boolean;
    }> = {},
  ) => {
    return prisma.user.create({
      data: {
        username: overrides.username ?? "organization-owner",
        displayName: overrides.displayName ?? "Organization Owner",
        email: overrides.email ?? "owner@example.com",
        hashedPassword: "unused-password-hash",
        isEmailVerified: overrides.isEmailVerified ?? true,
      },
    });
  };

  const createAuthCookie = (userId: string) => {
    const accessToken = generateAccessToken(userId);

    return `accessToken=${accessToken}`;
  };

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe("POST /api/v1/organizations", () => {
    it("creates an organization and owner membership", async () => {
      const user = await createUser();

      const response = await request(app)
        .post("/api/v1/organizations")
        .set("Cookie", createAuthCookie(user.id))
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
            description: organizationInput.description,
            website: organizationInput.website,
            logoUrl: organizationInput.logoUrl,
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
      const response = await request(app).post("/api/v1/organizations").send(organizationInput);

      expect(response.status).toBe(401);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 401,
        message: "Unauthorized! Access denied",
      });

      expect(await prisma.organization.count()).toBe(0);
      expect(await prisma.organizationMember.count()).toBe(0);
    });

    it("rejects an unverified user", async () => {
      const user = await createUser({
        isEmailVerified: false,
      });

      const response = await request(app)
        .post("/api/v1/organizations")
        .set("Cookie", createAuthCookie(user.id))
        .send(organizationInput);

      expect(response.status).toBe(401);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 401,
        message: "Unauthorized! Access denied",
      });

      expect(await prisma.organization.count()).toBe(0);
    });

    it("rejects invalid organization input", async () => {
      const user = await createUser();

      const response = await request(app)
        .post("/api/v1/organizations")
        .set("Cookie", createAuthCookie(user.id))
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

      expect(await prisma.organization.count()).toBe(0);
    });

    it("rejects a duplicate organization slug", async () => {
      const user = await createUser();

      await prisma.organization.create({
        data: {
          name: "Existing Organization",
          slug: organizationInput.slug,
        },
      });

      const response = await request(app)
        .post("/api/v1/organizations")
        .set("Cookie", createAuthCookie(user.id))
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
    });

    it("rejects a user who already belongs to an organization", async () => {
      const user = await createUser();

      const existingOrganization = await prisma.organization.create({
        data: {
          name: "Existing Organization",
          slug: "existing-organization",
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
        .post("/api/v1/organizations")
        .set("Cookie", createAuthCookie(user.id))
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
  });

  describe("GET /api/v1/organizations/me", () => {
    it("returns the authenticated user's organization", async () => {
      const user = await createUser();

      const organization = await prisma.organization.create({
        data: organizationInput,
      });

      const membership = await prisma.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          organizationRole: "OWNER",
        },
      });

      const response = await request(app)
        .get("/api/v1/organizations/me")
        .set("Cookie", createAuthCookie(user.id));

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        statusCode: 200,
        message: "Organization fetched successfully",
        data: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          description: organization.description,
          website: organization.website,
          logoUrl: organization.logoUrl,
          membership: {
            role: membership.organizationRole,
          },
        },
      });
    });

    it("returns 404 when the user has no organization", async () => {
      const user = await createUser();

      const response = await request(app)
        .get("/api/v1/organizations/me")
        .set("Cookie", createAuthCookie(user.id));

      expect(response.status).toBe(404);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 404,
        message: "User does not belong to an organization",
      });
    });

    it("rejects an unauthenticated request", async () => {
      const response = await request(app).get("/api/v1/organizations/me");

      expect(response.status).toBe(401);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 401,
        message: "Unauthorized! Access denied",
      });
    });

    it("rejects an unverified user", async () => {
      const user = await createUser({
        isEmailVerified: false,
      });

      const response = await request(app)
        .get("/api/v1/organizations/me")
        .set("Cookie", createAuthCookie(user.id));

      expect(response.status).toBe(401);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 401,
        message: "Unauthorized! Access denied",
      });
    });

    it("does not expose authentication data", async () => {
      const user = await createUser();

      const organization = await prisma.organization.create({
        data: {
          name: organizationInput.name,
          slug: organizationInput.slug,
        },
      });

      await prisma.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          organizationRole: "OWNER",
        },
      });

      const response = await request(app)
        .get("/api/v1/organizations/me")
        .set("Cookie", createAuthCookie(user.id));

      expect(response.status).toBe(200);

      expect(response.body.data).not.toHaveProperty("hashedPassword");

      expect(response.body.data).not.toHaveProperty("email");
      expect(response.body.data).not.toHaveProperty("user");
    });
  });
});
