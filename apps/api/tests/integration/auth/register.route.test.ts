import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import app from "../../../src/app";
import { prisma } from "../../../src/config/prisma";

import { sendVerificationEmail } from "../../../src/modules/auth/auth.email";
import { cleanDatabase } from "../../setup";

vi.mock("../../../src/modules/auth/auth.email", () => ({
  sendVerificationEmail: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
}));

describe("POST /api/v1/auth/register", () => {
  beforeEach(async () => {
    await cleanDatabase();

    vi.clearAllMocks();

    vi.mocked(sendVerificationEmail).mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a user and verification token", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      username: "karthik",
      displayName: "Karthik",
      email: "karthik@example.com",
      password: "Password123",
    });

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 201,
      message: "Account created. Please verify your email.",
    });

    const user = await prisma.user.findUnique({
      where: {
        email: "karthik@example.com",
      },
      include: {
        emailVerifications: true,
      },
    });

    expect(user).not.toBeNull();

    expect(user).toMatchObject({
      username: "karthik",
      displayName: "Karthik",
      email: "karthik@example.com",
      isEmailVerified: false,
    });

    expect(user?.hashedPassword).not.toBe("Password123");

    expect(user?.emailVerifications).toHaveLength(1);

    expect(user?.emailVerifications[0]).toMatchObject({
      usedAt: null,
    });

    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);

    expect(sendVerificationEmail).toHaveBeenCalledWith("karthik@example.com", expect.any(String));
  });

  it("rejects invalid registration input", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      username: "ab",
      displayName: "A",
      email: "not-an-email",
      password: "123",
    });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);

    const users = await prisma.user.count();

    expect(users).toBe(0);
  });

  it("rejects duplicate email", async () => {
    await request(app).post("/api/v1/auth/register").send({
      username: "karthik",
      displayName: "Karthik",
      email: "karthik@example.com",
      password: "Password123",
    });

    const response = await request(app).post("/api/v1/auth/register").send({
      username: "anotheruser",
      displayName: "Another User",
      email: "karthik@example.com",
      password: "Password123",
    });

    expect(response.status).toBe(409);

    const users = await prisma.user.count();

    expect(users).toBe(1);
  });

  it("rejects duplicate username", async () => {
    await request(app).post("/api/v1/auth/register").send({
      username: "karthik",
      displayName: "Karthik",
      email: "karthik@example.com",
      password: "Password123",
    });

    const response = await request(app).post("/api/v1/auth/register").send({
      username: "karthik",
      displayName: "Another User",
      email: "another@example.com",
      password: "Password123",
    });

    expect(response.status).toBe(409);

    const users = await prisma.user.count();

    expect(users).toBe(1);
  });

  it("normalizes username and email through validation", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      username: " Karthik_123 ",
      displayName: "Karthik",
      email: " Karthik@Example.com ",
      password: "Password123",
    });

    expect(response.status).toBe(201);

    const user = await prisma.user.findUnique({
      where: {
        email: "karthik@example.com",
      },
    });

    expect(user).toMatchObject({
      username: "karthik_123",
      email: "karthik@example.com",
    });
  });

  it("does not create a user when email validation fails", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      username: "karthik",
      displayName: "Karthik",
      email: "invalid-email",
      password: "Password123",
    });

    expect(response.status).toBe(400);

    expect(await prisma.user.count()).toBe(0);
  });
});
