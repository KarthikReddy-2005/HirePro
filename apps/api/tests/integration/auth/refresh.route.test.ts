import request from "supertest";
import bcrypt from "bcrypt";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import app from "../../../src/app";

import { prisma } from "../../../src/config/prisma";
import { env } from "../../../src/config/env";

import { hashToken } from "../../../src/utils/crypto";

import { cleanDatabase } from "../../setup";

describe("POST /api/v1/auth/refresh", () => {
  const userData = {
    username: "refreshuser",
    displayName: "Refresh User",
    email: "refresh@example.com",
    password: "Password123!",
  };

  beforeEach(async () => {
    await cleanDatabase();

    const hashedPassword = await bcrypt.hash(userData.password, env.BCRYPT_SALT_ROUNDS);

    await prisma.user.create({
      data: {
        username: userData.username,
        displayName: userData.displayName,
        email: userData.email,
        hashedPassword,
        isEmailVerified: true,
      },
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  const loginUser = async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: userData.email,
      password: userData.password,
    });

    expect(response.status).toBe(200);

    const cookies = response.headers["set-cookie"] as unknown as string[];

    const refreshCookie = cookies.find((cookie) => cookie.startsWith("refreshToken="));

    expect(refreshCookie).toBeDefined();

    return {
      response,
      cookies,
      refreshCookie: refreshCookie!,
    };
  };

  it("refreshes the access token successfully", async () => {
    const { refreshCookie } = await loginUser();

    const response = await request(app).post("/api/v1/auth/refresh").set("Cookie", refreshCookie);

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      message: "Access token refreshed successfully",
    });

    const responseCookies = response.headers["set-cookie"] as unknown as string[];

    expect(responseCookies).toBeDefined();

    expect(responseCookies).toEqual(
      expect.arrayContaining([expect.stringContaining("accessToken=")]),
    );
  });

  it("does not create another refresh token", async () => {
    const { refreshCookie } = await loginUser();

    const tokensBefore = await prisma.refreshToken.count();

    const response = await request(app).post("/api/v1/auth/refresh").set("Cookie", refreshCookie);

    expect(response.status).toBe(200);

    const tokensAfter = await prisma.refreshToken.count();

    expect(tokensAfter).toBe(tokensBefore);
  });

  it("rejects a request without a refresh token", async () => {
    const response = await request(app).post("/api/v1/auth/refresh");

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
      message: "Refresh token is required",
    });
  });

  it("rejects an invalid refresh token", async () => {
    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", "refreshToken=invalid-refresh-token");

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
      message: "Invalid refresh token",
    });
  });

  it("rejects a revoked refresh token", async () => {
    const { refreshCookie } = await loginUser();

    await prisma.refreshToken.updateMany({
      where: {
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    const response = await request(app).post("/api/v1/auth/refresh").set("Cookie", refreshCookie);

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
      message: "Invalid refresh token",
    });
  });

  it("rejects an expired refresh token", async () => {
    const rawRefreshToken = "expired-raw-refresh-token";

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: userData.email,
      },
    });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawRefreshToken),
        expiresAt: new Date(Date.now() - 60 * 1000),
      },
    });

    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", `refreshToken=${rawRefreshToken}`);

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
      message: "Invalid refresh token",
    });
  });

  it("rejects a valid refresh token when the user is unverified", async () => {
    const rawRefreshToken = "unverified-user-refresh-token";

    const user = await prisma.user.update({
      where: {
        email: userData.email,
      },
      data: {
        isEmailVerified: false,
      },
    });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", `refreshToken=${rawRefreshToken}`);

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
      message: "Unauthorized",
    });
  });

  it("rejects a valid refresh token when the user no longer exists", async () => {
    /*
     * Because RefreshToken belongs to User through a foreign key,
     * deleting the user may cascade-delete the token.
     *
     * In that case the API correctly returns
     * "Invalid refresh token" instead of "Unauthorized".
     */
    const rawRefreshToken = "deleted-user-refresh-token";

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: userData.email,
      },
    });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", `refreshToken=${rawRefreshToken}`);

    expect(response.status).toBe(401);

    expect(["Invalid refresh token", "Unauthorized"]).toContain(response.body.message);
  });
});
