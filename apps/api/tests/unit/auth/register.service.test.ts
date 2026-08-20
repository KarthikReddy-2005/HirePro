import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  findUserByEmail,
  findUserByUsername,
  createUserWithEmailVerification,
} from "../../../src/modules/auth/auth.repository";

import { sendVerificationEmail } from "../../../src/modules/auth/auth.email";

import { generateRandomToken, hashToken } from "../../../src/utils/crypto";

import { hashPassword } from "../../../src/utils/password";

import { registerService } from "../../../src/modules/auth/auth.service";
import { Prisma } from "@prisma/client";

console.log("TEST DATABASE:", process.env.DATABASE_URL);
console.log("TEST NODE_ENV:", process.env.NODE_ENV);

vi.mock("../../../src/modules/auth/auth.repository", () => ({
  findUserByEmail: vi.fn(),
  findUserByUsername: vi.fn(),
  createUserWithEmailVerification: vi.fn(),
  findPasswordByEmail: vi.fn(),
  findUserById: vi.fn(),
  findEmailVerificationByToken: vi.fn(),
  consumeEmailVerification: vi.fn(),
  createEmailVerification: vi.fn(),
  invalidateEmailVerifications: vi.fn(),
  createPasswordReset: vi.fn(),
  findPasswordResetByToken: vi.fn(),
  consumePasswordResetAndUpdatePassword: vi.fn(),
  findRefreshTokenByHash: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

vi.mock("../../../src/modules/auth/auth.email", () => ({
  sendVerificationEmail: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
}));

vi.mock("../../../src/utils/crypto", () => ({
  generateRandomToken: vi.fn(),
  hashToken: vi.fn(),
}));

vi.mock("../../../src/utils/password", () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));

describe("registerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(findUserByUsername).mockResolvedValue(null);
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    vi.mocked(hashPassword).mockResolvedValue("hashed-password");

    vi.mocked(generateRandomToken).mockReturnValue("raw-verification-token");

    vi.mocked(hashToken).mockReturnValue("hashed-verification-token");

    vi.mocked(createUserWithEmailVerification).mockResolvedValue({
      id: "user-1",
      username: "karthik",
      displayName: "Karthik",
      email: "karthik@example.com",
      avatarUrl: null,
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(sendVerificationEmail).mockResolvedValue(undefined);
  });

  it("registers a new user successfully", async () => {
    const result = await registerService({
      username: "karthik",
      displayName: "Karthik",
      email: "karthik@example.com",
      password: "Password123",
    });

    expect(result).toMatchObject({
      id: "user-1",
      username: "karthik",
      email: "karthik@example.com",
      isEmailVerified: false,
    });

    expect(findUserByUsername).toHaveBeenCalledWith("karthik");

    expect(findUserByEmail).toHaveBeenCalledWith("karthik@example.com");

    expect(hashPassword).toHaveBeenCalledWith("Password123");

    expect(generateRandomToken).toHaveBeenCalledTimes(1);

    expect(hashToken).toHaveBeenCalledWith("raw-verification-token");

    expect(createUserWithEmailVerification).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "karthik",
        displayName: "Karthik",
        email: "karthik@example.com",
        hashedPassword: "hashed-password",
        tokenHash: "hashed-verification-token",
        expiresAt: expect.any(Date),
      }),
    );

    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "karthik@example.com",
      "raw-verification-token",
    );
  });

  it("rejects an existing username", async () => {
    vi.mocked(findUserByUsername).mockResolvedValue({
      id: "existing-user",
    } as never);

    await expect(
      registerService({
        username: "karthik",
        displayName: "Karthik",
        email: "karthik@example.com",
        password: "Password123",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Username already exists",
    });

    expect(findUserByEmail).not.toHaveBeenCalled();
    expect(hashPassword).not.toHaveBeenCalled();
    expect(createUserWithEmailVerification).not.toHaveBeenCalled();
  });

  it("rejects an existing email", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: "existing-user",
    } as never);

    await expect(
      registerService({
        username: "karthik",
        displayName: "Karthik",
        email: "karthik@example.com",
        password: "Password123",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Email already exists",
    });

    expect(hashPassword).not.toHaveBeenCalled();
    expect(createUserWithEmailVerification).not.toHaveBeenCalled();
  });

  it("does not fail registration when verification email sending fails", async () => {
    vi.mocked(sendVerificationEmail).mockRejectedValue(new Error("Email provider unavailable"));

    const result = await registerService({
      username: "karthik",
      displayName: "Karthik",
      email: "karthik@example.com",
      password: "Password123",
    });

    expect(result).toMatchObject({
      id: "user-1",
      email: "karthik@example.com",
    });

    expect(createUserWithEmailVerification).toHaveBeenCalledTimes(1);
  });

  it("still protects against a race-condition duplicate", async () => {
    const uniqueConstraintError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "6.16.2",
      },
    );

    vi.mocked(createUserWithEmailVerification).mockRejectedValue(uniqueConstraintError);

    await expect(
      registerService({
        username: "karthik",
        displayName: "Karthik",
        email: "karthik@example.com",
        password: "Password123",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Username or email already exists",
    });
  });
});
