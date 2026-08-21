import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createEmailVerification,
  findUserForVerification,
  invalidateEmailVerifications,
} from "../../../src/modules/auth/auth.repository";

import { sendVerificationEmail } from "../../../src/modules/auth/auth.email";

import { generateRandomToken, hashToken } from "../../../src/utils/crypto";

import { resendVerificationService } from "../../../src/modules/auth/auth.service";

vi.mock("../../../src/modules/auth/auth.repository", () => ({
  findUserForVerification: vi.fn(),
  invalidateEmailVerifications: vi.fn(),
  createEmailVerification: vi.fn(),

  findUserByEmail: vi.fn(),
  findUserByUsername: vi.fn(),
  createUserWithEmailVerification: vi.fn(),
  findPasswordByEmail: vi.fn(),
  findUserById: vi.fn(),
  findEmailVerificationByToken: vi.fn(),
  consumeEmailVerification: vi.fn(),
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

describe("resendVerificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(findUserForVerification).mockResolvedValue({
      id: "user-1",
      email: "karthik@example.com",
      isEmailVerified: false,
    });

    vi.mocked(invalidateEmailVerifications).mockResolvedValue({
      count: 1,
    });

    vi.mocked(generateRandomToken).mockReturnValue("raw-verification-token");

    vi.mocked(hashToken).mockReturnValue("hashed-verification-token");

    vi.mocked(createEmailVerification).mockResolvedValue({
      id: "verification-2",
      userId: "user-1",
      tokenHash: "hashed-verification-token",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
    });

    vi.mocked(sendVerificationEmail).mockResolvedValue(undefined);
  });

  it("creates and sends a new verification token", async () => {
    await resendVerificationService("karthik@example.com");

    expect(findUserForVerification).toHaveBeenCalledTimes(1);
    expect(findUserForVerification).toHaveBeenCalledWith("karthik@example.com");

    expect(invalidateEmailVerifications).toHaveBeenCalledTimes(1);
    expect(invalidateEmailVerifications).toHaveBeenCalledWith("user-1");

    expect(generateRandomToken).toHaveBeenCalledTimes(1);

    expect(hashToken).toHaveBeenCalledTimes(1);
    expect(hashToken).toHaveBeenCalledWith("raw-verification-token");

    expect(createEmailVerification).toHaveBeenCalledTimes(1);

    expect(createEmailVerification).toHaveBeenCalledWith({
      userId: "user-1",
      tokenHash: "hashed-verification-token",
      expiresAt: expect.any(Date),
    });

    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);

    expect(sendVerificationEmail).toHaveBeenCalledWith(
      "karthik@example.com",
      "raw-verification-token",
    );
  });

  it("sets verification expiry approximately 15 minutes in the future", async () => {
    const before = Date.now();

    await resendVerificationService("karthik@example.com");

    const after = Date.now();

    const creationData = vi.mocked(createEmailVerification).mock.calls[0][0];

    expect(creationData.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 15 * 60 * 1000);

    expect(creationData.expiresAt.getTime()).toBeLessThanOrEqual(after + 15 * 60 * 1000);
  });

  it("does nothing when the account does not exist", async () => {
    vi.mocked(findUserForVerification).mockResolvedValue(null);

    await expect(resendVerificationService("unknown@example.com")).resolves.toBeUndefined();

    expect(invalidateEmailVerifications).not.toHaveBeenCalled();
    expect(generateRandomToken).not.toHaveBeenCalled();
    expect(hashToken).not.toHaveBeenCalled();
    expect(createEmailVerification).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("does nothing when the account is already verified", async () => {
    vi.mocked(findUserForVerification).mockResolvedValue({
      id: "user-1",
      email: "karthik@example.com",
      isEmailVerified: true,
    });

    await expect(resendVerificationService("karthik@example.com")).resolves.toBeUndefined();

    expect(invalidateEmailVerifications).not.toHaveBeenCalled();
    expect(generateRandomToken).not.toHaveBeenCalled();
    expect(createEmailVerification).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("invalidates previous unused verification tokens", async () => {
    await resendVerificationService("karthik@example.com");

    expect(invalidateEmailVerifications).toHaveBeenCalledBefore(vi.mocked(createEmailVerification));
  });

  it("does not store the raw verification token", async () => {
    await resendVerificationService("karthik@example.com");

    const creationData = vi.mocked(createEmailVerification).mock.calls[0][0];

    expect(creationData.tokenHash).toBe("hashed-verification-token");

    expect(creationData.tokenHash).not.toBe("raw-verification-token");
  });

  it("throws 500 when verification email delivery fails", async () => {
    vi.mocked(sendVerificationEmail).mockRejectedValue(new Error("Email provider unavailable"));

    await expect(resendVerificationService("karthik@example.com")).rejects.toMatchObject({
      statusCode: 500,
      message: "Unable to send verification email",
    });

    expect(createEmailVerification).toHaveBeenCalledTimes(1);
  });

  it("propagates repository errors", async () => {
    vi.mocked(createEmailVerification).mockRejectedValue(new Error("Database unavailable"));

    await expect(resendVerificationService("karthik@example.com")).rejects.toThrow(
      "Database unavailable",
    );

    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });
});
