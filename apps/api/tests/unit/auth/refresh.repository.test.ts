import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../src/config/prisma";

import {
  createRefreshToken,
  findRefreshTokenByHash,
} from "../../../src/modules/auth/auth.repository";

describe("refresh token repository", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("finds a refresh token by its hash", async () => {
    const expectedToken = {
      id: "refresh-token-1",
      userId: "user-1",
      tokenHash: "hashed-refresh-token",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      createdAt: new Date(),
    };

    const findUniqueSpy = vi
      .spyOn(prisma.refreshToken, "findUnique")
      .mockResolvedValue(expectedToken as never);

    const result = await findRefreshTokenByHash("hashed-refresh-token");

    expect(findUniqueSpy).toHaveBeenCalledWith({
      where: {
        tokenHash: "hashed-refresh-token",
      },
    });

    expect(result).toEqual(expectedToken);
  });

  it("returns null when the refresh token does not exist", async () => {
    vi.spyOn(prisma.refreshToken, "findUnique").mockResolvedValue(null);

    const result = await findRefreshTokenByHash("missing-token");

    expect(result).toBeNull();
  });

  it("creates a refresh token", async () => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const expectedToken = {
      id: "refresh-token-1",
      userId: "user-1",
      tokenHash: "hashed-refresh-token",
      expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    };

    const createSpy = vi
      .spyOn(prisma.refreshToken, "create")
      .mockResolvedValue(expectedToken as never);

    const result = await createRefreshToken({
      userId: "user-1",
      tokenHash: "hashed-refresh-token",
      expiresAt,
    });

    expect(createSpy).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        tokenHash: "hashed-refresh-token",
        expiresAt,
      },
    });

    expect(result).toEqual(expectedToken);
  });

  it("propagates refresh-token lookup errors", async () => {
    vi.spyOn(prisma.refreshToken, "findUnique").mockRejectedValue(
      new Error("Database unavailable"),
    );

    await expect(findRefreshTokenByHash("hashed-token")).rejects.toThrow("Database unavailable");
  });

  it("propagates refresh-token creation errors", async () => {
    vi.spyOn(prisma.refreshToken, "create").mockRejectedValue(new Error("Database unavailable"));

    await expect(
      createRefreshToken({
        userId: "user-1",
        tokenHash: "hashed-token",
        expiresAt: new Date(),
      }),
    ).rejects.toThrow("Database unavailable");
  });
});
