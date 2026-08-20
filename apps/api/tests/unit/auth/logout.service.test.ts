import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  findRefreshTokenByHash,
  revokeRefreshToken,
} from "../../../src/modules/auth/auth.repository";

import { hashToken } from "../../../src/utils/crypto";

import { logoutService } from "../../../src/modules/auth/auth.service";

vi.mock("../../../src/modules/auth/auth.repository", () => ({
  findRefreshTokenByHash: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

vi.mock("../../../src/utils/crypto", () => ({
  hashToken: vi.fn(),
}));

describe("logoutService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(hashToken).mockReturnValue("hashed-refresh-token");

    vi.mocked(findRefreshTokenByHash).mockResolvedValue({
      id: "refresh-token-1",
      userId: "user-1",
      tokenHash: "hashed-refresh-token",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      revokedAt: null,
      createdAt: new Date(),
    });

    vi.mocked(revokeRefreshToken).mockResolvedValue({
      count: 1,
    });
  });

  it("hashes the refresh token before looking it up", async () => {
    await logoutService("raw-refresh-token");

    expect(hashToken).toHaveBeenCalledTimes(1);
    expect(hashToken).toHaveBeenCalledWith("raw-refresh-token");

    expect(findRefreshTokenByHash).toHaveBeenCalledTimes(1);
    expect(findRefreshTokenByHash).toHaveBeenCalledWith("hashed-refresh-token");
  });

  it("revokes the refresh token when it exists", async () => {
    await logoutService("raw-refresh-token");

    expect(findRefreshTokenByHash).toHaveBeenCalledWith("hashed-refresh-token");

    expect(revokeRefreshToken).toHaveBeenCalledTimes(1);
    expect(revokeRefreshToken).toHaveBeenCalledWith("refresh-token-1");
  });

  it("does not revoke anything when the refresh token does not exist", async () => {
    vi.mocked(findRefreshTokenByHash).mockResolvedValue(null);

    await logoutService("invalid-refresh-token");

    expect(hashToken).toHaveBeenCalledWith("invalid-refresh-token");

    expect(findRefreshTokenByHash).toHaveBeenCalledWith("hashed-refresh-token");

    expect(revokeRefreshToken).not.toHaveBeenCalled();
  });

  it("does not revoke anything when the token is already revoked", async () => {
    vi.mocked(findRefreshTokenByHash).mockResolvedValue({
      id: "refresh-token-1",
      userId: "user-1",
      tokenHash: "hashed-refresh-token",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      revokedAt: new Date(),
      createdAt: new Date(),
    });

    await logoutService("raw-refresh-token");

    expect(revokeRefreshToken).toHaveBeenCalledTimes(1);
    expect(revokeRefreshToken).toHaveBeenCalledWith("refresh-token-1");
  });

  it("propagates repository errors", async () => {
    vi.mocked(findRefreshTokenByHash).mockRejectedValue(new Error("Database unavailable"));

    await expect(logoutService("raw-refresh-token")).rejects.toThrow("Database unavailable");

    expect(revokeRefreshToken).not.toHaveBeenCalled();
  });
});
