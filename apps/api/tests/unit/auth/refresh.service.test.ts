import { beforeEach, describe, expect, it, vi } from "vitest";

import { findRefreshTokenByHash, findUserById } from "../../../src/modules/auth/auth.repository";

import { hashToken } from "../../../src/utils/crypto";

import { refreshTokenService } from "../../../src/modules/auth/auth.service";

vi.mock("../../../src/modules/auth/auth.repository", () => ({
  findRefreshTokenByHash: vi.fn(),
  findUserById: vi.fn(),

  findUserByEmail: vi.fn(),
  findUserByUsername: vi.fn(),
  createUserWithEmailVerification: vi.fn(),
  findPasswordByEmail: vi.fn(),
  findEmailVerificationByToken: vi.fn(),
  consumeEmailVerification: vi.fn(),
  createEmailVerification: vi.fn(),
  invalidateEmailVerifications: vi.fn(),
  createPasswordReset: vi.fn(),
  findPasswordResetByToken: vi.fn(),
  consumePasswordResetAndUpdatePassword: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

vi.mock("../../../src/utils/crypto", () => ({
  hashToken: vi.fn(),
  generateRandomToken: vi.fn(),
}));

describe("refreshTokenService", () => {
  const validStoredToken = {
    id: "refresh-token-1",
    userId: "user-1",
    tokenHash: "hashed-refresh-token",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: new Date(),
  };

  const verifiedUser = {
    id: "user-1",
    username: "karthik",
    displayName: "Karthik",
    email: "karthik@example.com",
    avatarUrl: null,
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(hashToken).mockReturnValue("hashed-refresh-token");

    vi.mocked(findRefreshTokenByHash).mockResolvedValue(validStoredToken);

    vi.mocked(findUserById).mockResolvedValue(verifiedUser);
  });

  it("returns the user for a valid refresh token", async () => {
    const result = await refreshTokenService("raw-refresh-token");

    expect(result).toEqual(verifiedUser);

    expect(hashToken).toHaveBeenCalledWith("raw-refresh-token");

    expect(findRefreshTokenByHash).toHaveBeenCalledWith("hashed-refresh-token");

    expect(findUserById).toHaveBeenCalledWith("user-1");
  });

  it("rejects a refresh token that does not exist", async () => {
    vi.mocked(findRefreshTokenByHash).mockResolvedValue(null);

    await expect(refreshTokenService("invalid-token")).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid refresh token",
    });

    expect(findUserById).not.toHaveBeenCalled();
  });

  it("rejects a revoked refresh token", async () => {
    vi.mocked(findRefreshTokenByHash).mockResolvedValue({
      ...validStoredToken,
      revokedAt: new Date(),
    });

    await expect(refreshTokenService("raw-refresh-token")).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid refresh token",
    });

    expect(findUserById).not.toHaveBeenCalled();
  });

  it("rejects an expired refresh token", async () => {
    vi.mocked(findRefreshTokenByHash).mockResolvedValue({
      ...validStoredToken,
      expiresAt: new Date(Date.now() - 60 * 1000),
    });

    await expect(refreshTokenService("raw-refresh-token")).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid refresh token",
    });

    expect(findUserById).not.toHaveBeenCalled();
  });

  it("rejects when the user no longer exists", async () => {
    vi.mocked(findUserById).mockResolvedValue(null);

    await expect(refreshTokenService("raw-refresh-token")).rejects.toMatchObject({
      statusCode: 401,
      message: "Unauthorized",
    });
  });

  it("rejects an unverified user", async () => {
    vi.mocked(findUserById).mockResolvedValue({
      ...verifiedUser,
      isEmailVerified: false,
    });

    await expect(refreshTokenService("raw-refresh-token")).rejects.toMatchObject({
      statusCode: 401,
      message: "Unauthorized",
    });
  });

  it("propagates repository errors", async () => {
    vi.mocked(findRefreshTokenByHash).mockRejectedValue(new Error("Database unavailable"));

    await expect(refreshTokenService("raw-refresh-token")).rejects.toThrow("Database unavailable");
  });
});
