import request from "supertest";
import crypto from "node:crypto";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import app from "../../../src/app";
import { prisma } from "../../../src/config/prisma";

import { cleanDatabase } from "../../setup";

describe("GET /api/v1/auth/verify-email", () => {
  const userData = {
    username: "verifyuser",
    displayName: "Verify User",
    email: "verify@example.com",
    hashedPassword: "hashed-password",
  };

  beforeEach(async () => {
    await cleanDatabase();

    await prisma.user.create({
      data: userData,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("verifies a user's email successfully", async () => {
    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const verification = await prisma.emailVerification.create({
      data: {
        userId: (
          await prisma.user.findUniqueOrThrow({
            where: {
              email: userData.email,
            },
          })
        ).id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const response = await request(app).get("/api/v1/auth/verify-email").query({
      token: rawToken,
    });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      message: "Email verified successfully",
    });

    const user = await prisma.user.findUnique({
      where: {
        email: userData.email,
      },
    });

    expect(user?.isEmailVerified).toBe(true);

    const updatedVerification = await prisma.emailVerification.findUnique({
      where: {
        id: verification.id,
      },
    });

    expect(updatedVerification?.usedAt).not.toBeNull();
  });

  it("rejects a non-existent verification token", async () => {
    const rawToken = crypto.randomBytes(32).toString("hex");

    const response = await request(app).get("/api/v1/auth/verify-email").query({
      token: rawToken,
    });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: "Invalid or expired verification token",
      data: null,
    });

    const user = await prisma.user.findUnique({
      where: {
        email: userData.email,
      },
    });

    expect(user?.isEmailVerified).toBe(false);
  });

  it("rejects an expired verification token", async () => {
    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: userData.email,
      },
    });

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() - 60 * 1000),
      },
    });

    const response = await request(app).get("/api/v1/auth/verify-email").query({
      token: rawToken,
    });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: "Invalid or expired verification token",
      data: null,
    });

    const updatedUser = await prisma.user.findUnique({
      where: {
        email: userData.email,
      },
    });

    expect(updatedUser?.isEmailVerified).toBe(false);
  });

  it("rejects an already-used verification token", async () => {
    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: userData.email,
      },
    });

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        usedAt: new Date(),
      },
    });

    const response = await request(app).get("/api/v1/auth/verify-email").query({
      token: rawToken,
    });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: "Invalid or expired verification token",
      data: null,
    });
  });

  it("rejects an invalid token format before querying the database", async () => {
    const response = await request(app).get("/api/v1/auth/verify-email").query({
      token: "invalid-token",
    });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: "Invalid verification token",
      data: null,
    });
  });

  it("does not verify another user when the token belongs to a different user", async () => {
    const secondUser = await prisma.user.create({
      data: {
        username: "seconduser",
        displayName: "Second User",
        email: "second@example.com",
        hashedPassword: "hashed-password",
      },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await prisma.emailVerification.create({
      data: {
        userId: secondUser.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const response = await request(app).get("/api/v1/auth/verify-email").query({
      token: rawToken,
    });

    expect(response.status).toBe(200);

    const firstUser = await prisma.user.findUnique({
      where: {
        email: userData.email,
      },
    });

    expect(firstUser?.isEmailVerified).toBe(false);

    const updatedSecondUser = await prisma.user.findUnique({
      where: {
        email: secondUser.email,
      },
    });

    expect(updatedSecondUser?.isEmailVerified).toBe(true);
  });
});
