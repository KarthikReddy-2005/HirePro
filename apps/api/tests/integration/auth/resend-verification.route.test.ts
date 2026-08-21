import request from "supertest";

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import app from "../../../src/app";
import { prisma } from "../../../src/config/prisma";

import { sendVerificationEmail } from "../../../src/modules/auth/auth.email";

import { cleanDatabase } from "../../setup";

vi.mock("../../../src/modules/auth/auth.email", () => ({
  sendVerificationEmail: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
}));

describe("POST /api/v1/auth/resend-verification", () => {
  const userData = {
    username: "resenduser",
    displayName: "Resend User",
    email: "resend@example.com",
    hashedPassword: "hashed-password",
    isEmailVerified: false,
  };

  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();

    vi.mocked(sendVerificationEmail).mockResolvedValue(undefined);

    await prisma.user.create({
      data: userData,
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it("creates and sends a new verification token", async () => {
    const response = await request(app).post("/api/v1/auth/resend-verification").send({
      email: userData.email,
    });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      message: "If the account exists and is not verified, a verification email has been sent.",
    });

    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);

    expect(sendVerificationEmail).toHaveBeenCalledWith(userData.email, expect.any(String));

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: userData.email,
      },
      include: {
        emailVerifications: true,
      },
    });

    expect(user.emailVerifications).toHaveLength(1);

    expect(user.emailVerifications[0]).toMatchObject({
      userId: user.id,
      usedAt: null,
    });

    expect(user.emailVerifications[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("invalidates an existing unused token before creating a new token", async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: userData.email,
      },
    });

    const oldVerification = await prisma.emailVerification.create({
      data: {
        userId: user.id,
        tokenHash: "a".repeat(64),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const response = await request(app).post("/api/v1/auth/resend-verification").send({
      email: userData.email,
    });

    expect(response.status).toBe(200);

    const verificationRecords = await prisma.emailVerification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    expect(verificationRecords).toHaveLength(2);

    const oldToken = verificationRecords.find(
      (verification) => verification.id === oldVerification.id,
    );

    const newToken = verificationRecords.find(
      (verification) => verification.id !== oldVerification.id,
    );

    expect(oldToken?.usedAt).not.toBeNull();
    expect(newToken?.usedAt).toBeNull();
  });

  it("returns the same generic response when the account does not exist", async () => {
    const response = await request(app).post("/api/v1/auth/resend-verification").send({
      email: "unknown@example.com",
    });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      message: "If the account exists and is not verified, a verification email has been sent.",
    });

    expect(sendVerificationEmail).not.toHaveBeenCalled();

    expect(await prisma.emailVerification.count()).toBe(0);
  });

  it("returns the same generic response for an already verified account", async () => {
    await prisma.user.update({
      where: {
        email: userData.email,
      },
      data: {
        isEmailVerified: true,
      },
    });

    const response = await request(app).post("/api/v1/auth/resend-verification").send({
      email: userData.email,
    });

    expect(response.status).toBe(200);

    expect(response.body.message).toBe(
      "If the account exists and is not verified, a verification email has been sent.",
    );

    expect(sendVerificationEmail).not.toHaveBeenCalled();

    expect(await prisma.emailVerification.count()).toBe(0);
  });

  it("rejects an invalid email", async () => {
    const response = await request(app).post("/api/v1/auth/resend-verification").send({
      email: "invalid-email",
    });

    expect(response.status).toBe(400);

    expect(response.body.data).toMatchObject({
      email: "Invalid email address",
    });

    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("returns 500 when verification email delivery fails", async () => {
    vi.mocked(sendVerificationEmail).mockRejectedValue(new Error("Email provider unavailable"));

    const response = await request(app).post("/api/v1/auth/resend-verification").send({
      email: userData.email,
    });

    expect(response.status).toBe(500);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 500,
      message: "Unable to send verification email",
    });

    expect(await prisma.emailVerification.count()).toBe(1);
  });
});
