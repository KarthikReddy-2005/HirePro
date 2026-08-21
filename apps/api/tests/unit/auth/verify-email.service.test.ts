import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  consumeEmailVerification,
  findEmailVerificationByToken,
} from "../../../src/modules/auth/auth.repository";

import { hashToken } from "../../../src/utils/crypto";

import { verifyEmailService } from "../../../src/modules/auth/auth.service";

vi.mock("../../../src/modules/auth/auth.repository", () => ({
  findEmailVerificationByToken: vi.fn(),
  consumeEmailVerification: vi.fn(),

  findUserByEmail: vi.fn(),
  findUserByUsername: vi.fn(),
  createUserWithEmailVerification: vi.fn(),
  findPasswordByEmail: vi.fn(),
  findUserById: vi.fn(),
  createEmailVerification: vi.fn(),
  invalidateEmailVerifications: vi.fn(),
  createPasswordReset: vi.fn(),
  findPasswordResetByToken: vi.fn(),
  consumePasswordResetAndUpdatePassword: vi.fn(),
  findRefreshTokenByHash: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

vi.mock("../../../src/utils/crypto", () => ({
  hashToken: vi.fn(),
  generateRandomToken: vi.fn(),
}));

describe("verifyEmailService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(hashToken).mockReturnValue("hashed-verification-token");

    vi.mocked(findEmailVerificationByToken).mockResolvedValue({
      id: "verification-1",
      userId: "user-1",
      tokenHash: "hashed-verification-token",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
    });

    vi.mocked(consumeEmailVerification).mockResolvedValue(undefined);
  });

  it("hashes the raw verification token", async () => {
    await verifyEmailService("abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd");

    expect(hashToken).toHaveBeenCalledTimes(1);

    expect(hashToken).toHaveBeenCalledWith(
      "abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    );
  });

  it("finds the verification using the hashed token", async () => {
    await verifyEmailService("abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd");

    expect(findEmailVerificationByToken).toHaveBeenCalledWith("hashed-verification-token");
  });

  it("consumes a valid verification token", async () => {
    await verifyEmailService("abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd");

    expect(consumeEmailVerification).toHaveBeenCalledTimes(1);

    expect(consumeEmailVerification).toHaveBeenCalledWith("user-1", "verification-1");
  });

  it("rejects an invalid or expired verification token", async () => {
    vi.mocked(findEmailVerificationByToken).mockResolvedValue(null);

    await expect(
      verifyEmailService("abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd"),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid or expired verification token",
    });

    expect(consumeEmailVerification).not.toHaveBeenCalled();
  });

  it("propagates consume errors", async () => {
    vi.mocked(consumeEmailVerification).mockRejectedValue(new Error("Database unavailable"));

    await expect(
      verifyEmailService("abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd"),
    ).rejects.toThrow("Database unavailable");
  });
});
