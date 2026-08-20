import request from "supertest";
import bcrypt from "bcrypt";

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/config/prisma";
import { env } from "../../../src/config/env";
import app from "../../../src/app";
import { cleanDatabase } from "../../setup";

describe("POST /api/v1/auth/login", () => {
  const verifiedUser = {
    username: "loginuser",
    displayName: "Login User",
    email: "login@example.com",
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
    await prisma.refreshToken.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.user.deleteMany();

    await prisma.$disconnect();
  });

  it("should login a verified user successfully", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUser.email,
      password: verifiedUser.password,
    });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      statusCode: 200,
      message: "User logged in successfully",
    });

    expect(response.body.data).toMatchObject({
      username: verifiedUser.username,
      displayName: verifiedUser.displayName,
      email: verifiedUser.email,
      isEmailVerified: true,
    });

    expect(response.body.data.hashedPassword).toBeUndefined();

    const cookies = response.headers["set-cookie"];

    expect(cookies).toBeDefined();
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining("accessToken="),
        expect.stringContaining("refreshToken="),
      ]),
    );

    const refreshTokens = await prisma.refreshToken.findMany({
      where: {
        userId: response.body.data.id,
      },
    });

    expect(refreshTokens).toHaveLength(1);
    expect(refreshTokens[0].revokedAt).toBeNull();
  });

  it("should reject login with an incorrect password", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUser.email,
      password: "WrongPassword123!",
    });

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      message: "Invalid email or password",
    });

    expect(response.body.data).toBeNull();
  });

  it("should reject login when the email does not exist", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "doesnotexist@example.com",
      password: "Password123!",
    });

    expect(response.status).toBe(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      message: "Invalid email or password",
    });

    expect(response.body.data).toBeNull();
  });

  it("should reject login when email is not verified", async () => {
    await prisma.user.update({
      where: {
        email: verifiedUser.email,
      },
      data: {
        isEmailVerified: false,
      },
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUser.email,
      password: verifiedUser.password,
    });

    expect(response.status).toBe(403);

    expect(response.body).toMatchObject({
      statusCode: 403,
      message: "Please verify your email before logging in",
    });

    expect(response.body.data).toBeNull();
  });

  it("should reject an invalid email", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "not-an-email",
      password: verifiedUser.password,
    });

    expect(response.status).toBe(400);

    expect(response.body.statusCode).toBe(400);

    expect(response.body.data).toMatchObject({
      email: "Invalid email address",
    });
  });

  it("should reject a missing password", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: verifiedUser.email,
    });

    expect(response.status).toBe(400);
    expect(response.body.statusCode).toBe(400);

    expect(response.body.data).toMatchObject({
      password: expect.any(String),
    });
  });

  it("should reject a missing email", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      password: verifiedUser.password,
    });

    expect(response.status).toBe(400);

    expect(response.body.statusCode).toBe(400);
    expect(response.body.data).toMatchObject({
      email: "Invalid email address",
    });
  });
});
