import request from "supertest";
import bcrypt from "bcrypt";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import app from "../../../src/app";

import { prisma } from "../../../src/config/prisma";
import { env } from "../../../src/config/env";

import { generateAccessToken } from "../../../src/utils/jwt";

import { cleanDatabase } from "../../setup";

describe("GET /api/v1/auth/me", () => {
  const userData = {
    username: "meuser",
    displayName: "Me User",
    email: "me@example.com",
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

  it("returns the authenticated user", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: userData.email,
      password: userData.password,
    });

    expect(loginResponse.status).toBe(200);

    const cookies = loginResponse.headers["set-cookie"] as unknown as string[];

    const response = await request(app).get("/api/v1/auth/me").set("Cookie", cookies);

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      message: "User fetched successfully",
      data: {
        username: userData.username,
        displayName: userData.displayName,
        email: userData.email,
        isEmailVerified: true,
      },
    });

    expect(response.body.data.hashedPassword).toBeUndefined();
  });

  it("rejects a request without an access token", async () => {
    const response = await request(app).get("/api/v1/auth/me");

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
      message: "Unauthorized! Access denied",
    });
  });

  it("rejects an invalid access token", async () => {
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", "accessToken=invalid-access-token");

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
      message: "Unauthorized! Access denied",
    });
  });

  it("rejects a valid token when the user no longer exists", async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: userData.email,
      },
    });

    const accessToken = generateAccessToken(user.id);

    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", `accessToken=${accessToken}`);

    expect(response.status).toBe(401);

    expect(response.body.message).toBe("Unauthorized! Access denied");
  });

  it("rejects an unverified user", async () => {
    const user = await prisma.user.update({
      where: {
        email: userData.email,
      },
      data: {
        isEmailVerified: false,
      },
    });

    const accessToken = generateAccessToken(user.id);

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", `accessToken=${accessToken}`);

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
      message: "Unauthorized! Access denied",
    });
  });
});
