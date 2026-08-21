import { beforeEach, describe, expect, it, vi } from "vitest";

import { consumePasswordResetAndUpdatePassword } from "../../../src/modules/auth/auth.repository";

import { hashToken } from "../../../src/utils/crypto";

import { hashPassword } from "../../../src/utils/password";

import { resetPasswordService } from "../../../src/modules/auth/auth.service";

vi.mock("../../../src/modules/auth/auth.repository", () => ({
  consumePasswordResetAndUpdatePassword: vi.fn(),

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
  findRefreshTokenByHash: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

vi.mock("../../../src/utils/crypto", () => ({
  hashToken: vi.fn(),
  generateRandomToken: vi.fn(),
}));

vi.mock("../../../src/utils/password", () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));

describe("resetPasswordService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(hashToken).mockReturnValue("hashed-reset-token");

    vi.mocked(hashPassword).mockResolvedValue("hashed-new-password");

    vi.mocked(consumePasswordResetAndUpdatePassword).mockResolvedValue(undefined);
  });

  it("hashes the reset token and new password", async () => {
    await resetPasswordService("raw-reset-token", "NewPassword123!");

    expect(hashToken).toHaveBeenCalledTimes(1);

    expect(hashToken).toHaveBeenCalledWith("raw-reset-token");

    expect(hashPassword).toHaveBeenCalledTimes(1);

    expect(hashPassword).toHaveBeenCalledWith("NewPassword123!");
  });

  it("consumes the reset token and updates the password", async () => {
    await resetPasswordService("raw-reset-token", "NewPassword123!");

    expect(consumePasswordResetAndUpdatePassword).toHaveBeenCalledTimes(1);

    expect(consumePasswordResetAndUpdatePassword).toHaveBeenCalledWith(
      "hashed-reset-token",
      "hashed-new-password",
    );
  });

  it("does not pass the raw reset token to the repository", async () => {
    await resetPasswordService("raw-reset-token", "NewPassword123!");

    const call = vi.mocked(consumePasswordResetAndUpdatePassword).mock.calls[0];

    expect(call[0]).toBe("hashed-reset-token");
    expect(call[0]).not.toBe("raw-reset-token");
  });

  it("does not pass the plain password to the repository", async () => {
    await resetPasswordService("raw-reset-token", "NewPassword123!");

    const call = vi.mocked(consumePasswordResetAndUpdatePassword).mock.calls[0];

    expect(call[1]).toBe("hashed-new-password");
    expect(call[1]).not.toBe("NewPassword123!");
  });

  it("propagates reset repository errors", async () => {
    vi.mocked(consumePasswordResetAndUpdatePassword).mockRejectedValue(
      new Error("Invalid or expired reset token"),
    );

    await expect(resetPasswordService("raw-reset-token", "NewPassword123!")).rejects.toThrow(
      "Invalid or expired reset token",
    );
  });

  it("propagates password hashing errors", async () => {
    vi.mocked(hashPassword).mockRejectedValue(new Error("Hashing failed"));

    await expect(resetPasswordService("raw-reset-token", "NewPassword123!")).rejects.toThrow(
      "Hashing failed",
    );

    expect(consumePasswordResetAndUpdatePassword).not.toHaveBeenCalled();
  });
});
