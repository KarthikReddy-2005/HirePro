import request from "supertest";
import bcrypt from "bcrypt";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import app from "../../../src/app";
import { prisma } from "../../../src/config/prisma";
import { env } from "../../../src/config/env";

import { cleanDatabase } from "../../setup";

describe("POST /api/v1/auth/logout", () => {
  const verifiedUser = {
    username: "logoutuser",
    displayName: "Logout User",
    email: "logout@example.com",
    password: "Password123!",
  };

  beforeEach(async () => {
    await cleanDatabase();

    const hashedPassword = await bcrypt.hash(verifiedUser.password, env.BCRYPT_SALT_ROUNDS);

    await prisma.user.create({
      data: {
        username: verifiedUser.username,
        displayName: verifiedUser.displayName,
        email: verifiedUser.email,
        hashedPassword,
        isEmailVerified: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("logs out an authenticated user successfully", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUser.email,
      password: verifiedUser.password,
    });

    expect(loginResponse.status).toBe(200);

    const loginCookies = loginResponse.headers["set-cookie"];

    expect(loginCookies).toBeDefined();

    const logoutResponse = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", loginCookies);

    expect(logoutResponse.status).toBe(200);

    expect(logoutResponse.body).toMatchObject({
      success: true,
      statusCode: 200,
    });
  });

  it("revokes the refresh token", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUser.email,
      password: verifiedUser.password,
    });

    expect(loginResponse.status).toBe(200);

    const loginCookies = loginResponse.headers["set-cookie"];

    const refreshToken = await prisma.refreshToken.findFirst({
      where: {
        user: {
          email: verifiedUser.email,
        },
      },
    });

    expect(refreshToken).not.toBeNull();
    expect(refreshToken?.revokedAt).toBeNull();

    const logoutResponse = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", loginCookies);

    expect(logoutResponse.status).toBe(200);

    const updatedRefreshToken = await prisma.refreshToken.findUnique({
      where: {
        id: refreshToken!.id,
      },
    });

    expect(updatedRefreshToken).not.toBeNull();
    expect(updatedRefreshToken?.revokedAt).not.toBeNull();
  });

  it("clears the access token cookie", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUser.email,
      password: verifiedUser.password,
    });

    expect(loginResponse.status).toBe(200);

    const loginCookies = loginResponse.headers["set-cookie"];

    expect(loginCookies).toEqual(expect.arrayContaining([expect.stringContaining("accessToken=")]));

    const logoutResponse = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", loginCookies);

    expect(logoutResponse.status).toBe(200);

    const logoutCookies = logoutResponse.headers["set-cookie"];

    expect(logoutCookies).toBeDefined();

    expect(logoutCookies).toEqual(
      expect.arrayContaining([expect.stringContaining("accessToken=")]),
    );
  });

  it("clears the refresh token cookie", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUser.email,
      password: verifiedUser.password,
    });

    expect(loginResponse.status).toBe(200);

    const loginCookies = loginResponse.headers["set-cookie"];

    expect(loginCookies).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=")]),
    );

    const logoutResponse = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", loginCookies);

    expect(logoutResponse.status).toBe(200);

    const logoutCookies = logoutResponse.headers["set-cookie"];

    expect(logoutCookies).toBeDefined();

    expect(logoutCookies).toEqual(
      expect.arrayContaining([expect.stringContaining("refreshToken=")]),
    );
  });

  it("logs out successfully when no authentication cookie is provided", async () => {
    const response = await request(app).post("/api/v1/auth/logout");

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      message: "User logged out successfully",
    });

    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("accessToken=;"),
        expect.stringContaining("refreshToken=;"),
      ]),
    );
  });

  it("logs out successfully with an invalid refresh token", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", "refreshToken=invalid-refresh-token");

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      message: "User logged out successfully",
    });

    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("accessToken=;"),
        expect.stringContaining("refreshToken=;"),
      ]),
    );
  });

  it("does not create additional refresh tokens during logout", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUser.email,
      password: verifiedUser.password,
    });

    expect(loginResponse.status).toBe(200);

    const loginCookies = loginResponse.headers["set-cookie"];

    const tokensBeforeLogout = await prisma.refreshToken.count({
      where: {
        user: {
          email: verifiedUser.email,
        },
      },
    });

    expect(tokensBeforeLogout).toBe(1);

    const logoutResponse = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", loginCookies);

    expect(logoutResponse.status).toBe(200);

    const tokensAfterLogout = await prisma.refreshToken.count({
      where: {
        user: {
          email: verifiedUser.email,
        },
      },
    });

    expect(tokensAfterLogout).toBe(1);
  });

  it("does not delete the user when logging out", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUser.email,
      password: verifiedUser.password,
    });

    expect(loginResponse.status).toBe(200);

    const loginCookies = loginResponse.headers["set-cookie"];

    const logoutResponse = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", loginCookies);

    expect(logoutResponse.status).toBe(200);

    const user = await prisma.user.findUnique({
      where: {
        email: verifiedUser.email,
      },
    });

    expect(user).not.toBeNull();

    expect(user).toMatchObject({
      username: verifiedUser.username,
      email: verifiedUser.email,
      isEmailVerified: true,
    });
  });

  it("can safely be called again with the same cookies", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUser.email,
      password: verifiedUser.password,
    });

    expect(loginResponse.status).toBe(200);

    const loginCookies = loginResponse.headers["set-cookie"];

    const firstLogoutResponse = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", loginCookies);

    expect(firstLogoutResponse.status).toBe(200);

    const secondLogoutResponse = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", loginCookies);

    expect(secondLogoutResponse.status).toBe(200);
  });
});
