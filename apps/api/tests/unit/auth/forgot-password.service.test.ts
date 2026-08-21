import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPasswordReset, findUserByEmail } from "../../../src/modules/auth/auth.repository";

import { sendResetPasswordEmail } from "../../../src/modules/auth/auth.email";

import { generateRandomToken, hashToken } from "../../../src/utils/crypto";

import { forgotPasswordService } from "../../../src/modules/auth/auth.service";

vi.mock("../../../src/modules/auth/auth.repository", () => ({
  findUserByEmail: vi.fn(),
  createPasswordReset: vi.fn(),

  findUserByUsername: vi.fn(),
  createUserWithEmailVerification: vi.fn(),
  findPasswordByEmail: vi.fn(),
  findUserById: vi.fn(),
  findEmailVerificationByToken: vi.fn(),
  consumeEmailVerification: vi.fn(),
  createEmailVerification: vi.fn(),
  invalidateEmailVerifications: vi.fn(),
  findPasswordResetByToken: vi.fn(),
  consumePasswordResetAndUpdatePassword: vi.fn(),
  findRefreshTokenByHash: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

vi.mock("../../../src/modules/auth/auth.email", () => ({
  sendResetPasswordEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

vi.mock("../../../src/utils/crypto", () => ({
  generateRandomToken: vi.fn(),
  hashToken: vi.fn(),
}));

describe("forgotPasswordService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(findUserByEmail).mockResolvedValue({
      id: "user-1",
    });

    vi.mocked(generateRandomToken).mockReturnValue("raw-reset-token");

    vi.mocked(hashToken).mockReturnValue("hashed-reset-token");

    vi.mocked(createPasswordReset).mockResolvedValue({
      id: "reset-1",
      userId: "user-1",
      tokenHash: "hashed-reset-token",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
    });

    vi.mocked(sendResetPasswordEmail).mockResolvedValue(undefined);
  });

  it("creates a password reset token for an existing user", async () => {
    await forgotPasswordService("karthik@example.com");

    expect(findUserByEmail).toHaveBeenCalledWith("karthik@example.com");

    expect(generateRandomToken).toHaveBeenCalledTimes(1);

    expect(hashToken).toHaveBeenCalledWith("raw-reset-token");

    expect(createPasswordReset).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        tokenHash: "hashed-reset-token",
        expiresAt: expect.any(Date),
      }),
    );

    expect(sendResetPasswordEmail).toHaveBeenCalledWith("karthik@example.com", "raw-reset-token");
  });

  it("sets the reset token expiry approximately 15 minutes in the future", async () => {
    const before = Date.now();

    await forgotPasswordService("karthik@example.com");

    const after = Date.now();

    const call = vi.mocked(createPasswordReset).mock.calls[0][0];

    const expiresAt = call.expiresAt.getTime();

    expect(expiresAt).toBeGreaterThanOrEqual(before + 15 * 60 * 1000);

    expect(expiresAt).toBeLessThanOrEqual(after + 15 * 60 * 1000);
  });

  it("does nothing when the email does not exist", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    await expect(forgotPasswordService("unknown@example.com")).resolves.toBeUndefined();

    expect(generateRandomToken).not.toHaveBeenCalled();
    expect(hashToken).not.toHaveBeenCalled();
    expect(createPasswordReset).not.toHaveBeenCalled();
    expect(sendResetPasswordEmail).not.toHaveBeenCalled();
  });

  it("propagates password reset repository errors", async () => {
    vi.mocked(createPasswordReset).mockRejectedValue(new Error("Database unavailable"));

    await expect(forgotPasswordService("karthik@example.com")).rejects.toThrow(
      "Database unavailable",
    );

    expect(sendResetPasswordEmail).not.toHaveBeenCalled();
  });

  it("throws 500 when reset email delivery fails", async () => {
    vi.mocked(sendResetPasswordEmail).mockRejectedValue(new Error("Email provider unavailable"));

    await expect(forgotPasswordService("karthik@example.com")).rejects.toMatchObject({
      statusCode: 500,
      message: "Unable to send password reset email",
    });

    expect(createPasswordReset).toHaveBeenCalledTimes(1);
  });

  it("never exposes the raw reset token to the repository", async () => {
    await forgotPasswordService("karthik@example.com");

    const call = vi.mocked(createPasswordReset).mock.calls[0][0];

    expect(call.tokenHash).toBe("hashed-reset-token");
    expect(call.tokenHash).not.toBe("raw-reset-token");
  });
});
