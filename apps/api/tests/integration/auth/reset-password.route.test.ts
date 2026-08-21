import request from "supertest";
import crypto from "node:crypto";
import bcrypt from "bcrypt";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import app from "../../../src/app";
import { prisma } from "../../../src/config/prisma";
import { env } from "../../../src/config/env";

import { cleanDatabase } from "../../setup";

describe("POST /api/v1/auth/reset-password", () => {
  const user = {
    username: "resetuser",
    displayName: "Reset User",
    email: "reset@example.com",
    password: "OldPassword123!",
  };

  beforeEach(async () => {
    await cleanDatabase();

    const hashedPassword = await bcrypt.hash(user.password, env.BCRYPT_SALT_ROUNDS);

    await prisma.user.create({
      data: {
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        hashedPassword,
        isEmailVerified: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const createResetToken = async () => {
    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const dbUser = await prisma.user.findUniqueOrThrow({
      where: {
        email: user.email,
      },
    });

    const resetToken = await prisma.passwordReset.create({
      data: {
        userId: dbUser.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    return {
      rawToken,
      resetToken,
    };
  };

  it("resets the password successfully", async () => {
    const { rawToken, resetToken } = await createResetToken();

    const response = await request(app).post(`/api/v1/auth/reset-password?token=${rawToken}`).send({
      password: "NewPassword123!",
    });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      message: "Password reset successfully",
    });

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: {
        email: user.email,
      },
    });

    expect(updatedUser.hashedPassword).not.toBe(user.password);

    expect(await bcrypt.compare("NewPassword123!", updatedUser.hashedPassword)).toBe(true);

    const consumedToken = await prisma.passwordReset.findUnique({
      where: {
        id: resetToken.id,
      },
    });

    expect(consumedToken?.usedAt).not.toBeNull();
  });

  it("cannot reuse a reset token", async () => {
    const { rawToken } = await createResetToken();

    const firstResponse = await request(app)
      .post(`/api/v1/auth/reset-password?token=${rawToken}`)
      .send({
        password: "NewPassword123!",
      });

    expect(firstResponse.status).toBe(200);

    const secondResponse = await request(app)
      .post(`/api/v1/auth/reset-password?token=${rawToken}`)
      .send({
        password: "AnotherPassword123!",
      });

    expect(secondResponse.status).toBe(400);

    expect(secondResponse.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: "Invalid or expired reset token",
    });
  });

  it("rejects an invalid reset token", async () => {
    const invalidToken = crypto.randomBytes(32).toString("hex");

    const response = await request(app)
      .post(`/api/v1/auth/reset-password?token=${invalidToken}`)
      .send({
        password: "NewPassword123!",
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: "Invalid or expired reset token",
    });
  });

  it("rejects an expired reset token", async () => {
    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const dbUser = await prisma.user.findUniqueOrThrow({
      where: {
        email: user.email,
      },
    });

    await prisma.passwordReset.create({
      data: {
        userId: dbUser.id,
        tokenHash,
        expiresAt: new Date(Date.now() - 60 * 1000),
      },
    });

    const response = await request(app).post(`/api/v1/auth/reset-password?token=${rawToken}`).send({
      password: "NewPassword123!",
    });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: "Invalid or expired reset token",
    });

    const currentUser = await prisma.user.findUniqueOrThrow({
      where: {
        email: user.email,
      },
    });

    expect(await bcrypt.compare(user.password, currentUser.hashedPassword)).toBe(true);
  });

  it("rejects a used reset token", async () => {
    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const dbUser = await prisma.user.findUniqueOrThrow({
      where: {
        email: user.email,
      },
    });

    await prisma.passwordReset.create({
      data: {
        userId: dbUser.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        usedAt: new Date(),
      },
    });

    const response = await request(app).post(`/api/v1/auth/reset-password?token=${rawToken}`).send({
      password: "NewPassword123!",
    });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: "Invalid or expired reset token",
    });
  });

  it("rejects a missing reset token", async () => {
    const response = await request(app).post("/api/v1/auth/reset-password").send({
      password: "NewPassword123!",
    });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: "Reset token is required",
      data: null,
    });
  });

  it("rejects an invalid reset token format", async () => {
    const response = await request(app)
      .post("/api/v1/auth/reset-password?token=invalid-token")
      .send({
        password: "NewPassword123!",
      });

    /*
     * Current controller does not validate reset-token
     * format before calling resetPasswordService().
     *
     * Therefore this request reaches the service and
     * results in "Invalid or expired reset token".
     */
    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: "Invalid or expired reset token",
    });
  });

  it("rejects a password shorter than 8 characters", async () => {
    const { rawToken } = await createResetToken();

    const response = await request(app).post(`/api/v1/auth/reset-password?token=${rawToken}`).send({
      password: "short",
    });

    expect(response.status).toBe(400);

    expect(response.body.data).toMatchObject({
      password: expect.any(String),
    });
  });

  it("does not leave the old password valid", async () => {
    const { rawToken } = await createResetToken();

    const response = await request(app).post(`/api/v1/auth/reset-password?token=${rawToken}`).send({
      password: "NewPassword123!",
    });

    expect(response.status).toBe(200);

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: {
        email: user.email,
      },
    });

    expect(await bcrypt.compare(user.password, updatedUser.hashedPassword)).toBe(false);

    expect(await bcrypt.compare("NewPassword123!", updatedUser.hashedPassword)).toBe(true);
  });

  it("revokes existing refresh tokens after password reset", async () => {
    const { rawToken } = await createResetToken();

    const dbUser = await prisma.user.findUniqueOrThrow({
      where: {
        email: user.email,
      },
    });

    await prisma.refreshToken.create({
      data: {
        userId: dbUser.id,
        tokenHash: crypto.createHash("sha256").update("refresh-token-1").digest("hex"),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const response = await request(app).post(`/api/v1/auth/reset-password?token=${rawToken}`).send({
      password: "NewPassword123!",
    });

    expect(response.status).toBe(200);

    const refreshToken = await prisma.refreshToken.findFirst({
      where: {
        userId: dbUser.id,
      },
    });

    expect(refreshToken?.revokedAt).not.toBeNull();
  });
});
