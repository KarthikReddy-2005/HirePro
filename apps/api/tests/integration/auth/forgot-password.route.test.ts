import request from "supertest";

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import app from "../../../src/app";
import { prisma } from "../../../src/config/prisma";

import { sendResetPasswordEmail } from "../../../src/modules/auth/auth.email";

import { cleanDatabase } from "../../setup";

vi.mock("../../../src/modules/auth/auth.email", () => ({
  sendResetPasswordEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

describe("POST /api/v1/auth/forgot-password", () => {
  const user = {
    username: "forgotuser",
    displayName: "Forgot User",
    email: "forgot@example.com",
    hashedPassword: "hashed-password",
  };

  beforeEach(async () => {
    await cleanDatabase();

    vi.clearAllMocks();

    vi.mocked(sendResetPasswordEmail).mockResolvedValue(undefined);

    await prisma.user.create({
      data: user,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a password reset token and sends a reset email", async () => {
    const response = await request(app).post("/api/v1/auth/forgot-password").send({
      email: user.email,
    });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      message: "If an account exists with this email, a reset link has been sent.",
    });

    expect(sendResetPasswordEmail).toHaveBeenCalledTimes(1);

    expect(sendResetPasswordEmail).toHaveBeenCalledWith(user.email, expect.any(String));

    const resetTokens = await prisma.passwordReset.findMany({
      where: {
        user: {
          email: user.email,
        },
      },
    });

    expect(resetTokens).toHaveLength(1);

    expect(resetTokens[0]).toMatchObject({
      userId: expect.any(String),
      tokenHash: expect.any(String),
      usedAt: null,
    });

    expect(resetTokens[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("returns the same generic response when the account does not exist", async () => {
    const response = await request(app).post("/api/v1/auth/forgot-password").send({
      email: "unknown@example.com",
    });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      message: "If an account exists with this email, a reset link has been sent.",
    });

    expect(sendResetPasswordEmail).not.toHaveBeenCalled();

    const resetTokens = await prisma.passwordReset.count();

    expect(resetTokens).toBe(0);
  });

  it("normalizes email before processing it", async () => {
    const response = await request(app).post("/api/v1/auth/forgot-password").send({
      email: " FORGOT@EXAMPLE.COM ",
    });

    expect(response.status).toBe(200);

    expect(sendResetPasswordEmail).toHaveBeenCalledWith("forgot@example.com", expect.any(String));
  });

  it("rejects an invalid email", async () => {
    const response = await request(app).post("/api/v1/auth/forgot-password").send({
      email: "not-an-email",
    });

    expect(response.status).toBe(400);

    expect(response.body.data).toMatchObject({
      email: "Invalid email address",
    });

    expect(sendResetPasswordEmail).not.toHaveBeenCalled();

    expect(await prisma.passwordReset.count()).toBe(0);
  });

  it("does not expose a database error to the client", async () => {
    vi.mocked(sendResetPasswordEmail).mockResolvedValue(undefined);

    await prisma.user.delete({
      where: {
        email: user.email,
      },
    });

    const response = await request(app).post("/api/v1/auth/forgot-password").send({
      email: "unknown@example.com",
    });

    expect(response.status).toBe(200);

    expect(response.body.statusCode).toBe(200);
  });

  it("does not create multiple tokens for a single request", async () => {
    await request(app).post("/api/v1/auth/forgot-password").send({
      email: user.email,
    });

    const resetTokens = await prisma.passwordReset.findMany({
      where: {
        user: {
          email: user.email,
        },
      },
    });

    expect(resetTokens).toHaveLength(1);
  });

  it("creates a hashed token rather than storing the raw token", async () => {
    await request(app).post("/api/v1/auth/forgot-password").send({
      email: user.email,
    });

    const reset = await prisma.passwordReset.findFirst({
      where: {
        user: {
          email: user.email,
        },
      },
    });

    expect(reset).not.toBeNull();

    const rawToken = vi.mocked(sendResetPasswordEmail).mock.calls[0][1];

    expect(reset?.tokenHash).not.toBe(rawToken);
    expect(reset?.tokenHash).toHaveLength(64);
  });

  it("returns 500 when reset email delivery fails", async () => {
    vi.mocked(sendResetPasswordEmail).mockRejectedValue(new Error("Email provider unavailable"));

    const response = await request(app).post("/api/v1/auth/forgot-password").send({
      email: user.email,
    });

    expect(response.status).toBe(500);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 500,
      message: "Unable to send password reset email",
    });

    const resetTokens = await prisma.passwordReset.findMany({
      where: {
        user: {
          email: user.email,
        },
      },
    });

    expect(resetTokens).toHaveLength(1);
  });
});
