import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../src/config/prisma";

import {
  consumePasswordResetAndUpdatePassword,
  findPasswordResetByToken,
} from "../../../src/modules/auth/auth.repository";

describe("reset password repository", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("finds a password reset token by hash", async () => {
    const expectedReset = {
      id: "reset-1",
      userId: "user-1",
      tokenHash: "hashed-reset-token",
      usedAt: null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };

    const spy = vi
      .spyOn(prisma.passwordReset, "findUnique")
      .mockResolvedValue(expectedReset as never);

    const result = await findPasswordResetByToken("hashed-reset-token");

    expect(spy).toHaveBeenCalledWith({
      where: {
        tokenHash: "hashed-reset-token",
      },
    });

    expect(result).toEqual(expectedReset);
  });

  it("consumes a valid reset token and updates the password atomically", async () => {
    const resetFindUnique = vi.fn().mockResolvedValue({
      id: "reset-1",
      userId: "user-1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const resetUpdateMany = vi.fn().mockResolvedValue({
      count: 1,
    });

    const userUpdate = vi.fn().mockResolvedValue({
      id: "user-1",
    });

    const refreshTokenUpdateMany = vi.fn().mockResolvedValue({
      count: 2,
    });

    const transactionSpy = vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
      const tx = {
        passwordReset: {
          findUnique: resetFindUnique,
          updateMany: resetUpdateMany,
        },
        user: {
          update: userUpdate,
        },
        refreshToken: {
          updateMany: refreshTokenUpdateMany,
        },
      };

      return callback(tx as never);
    });

    await consumePasswordResetAndUpdatePassword("hashed-reset-token", "hashed-new-password");

    expect(transactionSpy).toHaveBeenCalledTimes(1);

    expect(resetFindUnique).toHaveBeenCalledWith({
      where: {
        tokenHash: "hashed-reset-token",
      },
      select: {
        id: true,
        userId: true,
        usedAt: true,
        expiresAt: true,
      },
    });

    expect(resetUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "reset-1",
        usedAt: null,
        expiresAt: {
          gt: expect.any(Date),
        },
      },
      data: {
        usedAt: expect.any(Date),
      },
    });

    expect(userUpdate).toHaveBeenCalledWith({
      where: {
        id: "user-1",
      },
      data: {
        hashedPassword: "hashed-new-password",
      },
    });

    expect(refreshTokenUpdateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
  });

  it("rejects a missing reset token", async () => {
    const resetFindUnique = vi.fn().mockResolvedValue(null);

    const resetUpdateMany = vi.fn();
    const userUpdate = vi.fn();
    const refreshTokenUpdateMany = vi.fn();

    vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
      const tx = {
        passwordReset: {
          findUnique: resetFindUnique,
          updateMany: resetUpdateMany,
        },
        user: {
          update: userUpdate,
        },
        refreshToken: {
          updateMany: refreshTokenUpdateMany,
        },
      };

      return callback(tx as never);
    });

    await expect(
      consumePasswordResetAndUpdatePassword("invalid-token", "hashed-password"),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid or expired reset token",
    });

    expect(resetUpdateMany).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
    expect(refreshTokenUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects an already-used reset token", async () => {
    const resetFindUnique = vi.fn().mockResolvedValue({
      id: "reset-1",
      userId: "user-1",
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const resetUpdateMany = vi.fn();
    const userUpdate = vi.fn();
    const refreshTokenUpdateMany = vi.fn();

    vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
      const tx = {
        passwordReset: {
          findUnique: resetFindUnique,
          updateMany: resetUpdateMany,
        },
        user: {
          update: userUpdate,
        },
        refreshToken: {
          updateMany: refreshTokenUpdateMany,
        },
      };

      return callback(tx as never);
    });

    await expect(
      consumePasswordResetAndUpdatePassword("hashed-reset-token", "hashed-password"),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid or expired reset token",
    });

    expect(resetUpdateMany).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
    expect(refreshTokenUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects an expired reset token", async () => {
    const resetFindUnique = vi.fn().mockResolvedValue({
      id: "reset-1",
      userId: "user-1",
      usedAt: null,
      expiresAt: new Date(Date.now() - 60 * 1000),
    });

    const resetUpdateMany = vi.fn();
    const userUpdate = vi.fn();
    const refreshTokenUpdateMany = vi.fn();

    vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
      const tx = {
        passwordReset: {
          findUnique: resetFindUnique,
          updateMany: resetUpdateMany,
        },
        user: {
          update: userUpdate,
        },
        refreshToken: {
          updateMany: refreshTokenUpdateMany,
        },
      };

      return callback(tx as never);
    });

    await expect(
      consumePasswordResetAndUpdatePassword("hashed-reset-token", "hashed-password"),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid or expired reset token",
    });

    expect(resetUpdateMany).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
    expect(refreshTokenUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects when another request consumed the token first", async () => {
    const resetFindUnique = vi.fn().mockResolvedValue({
      id: "reset-1",
      userId: "user-1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const resetUpdateMany = vi.fn().mockResolvedValue({
      count: 0,
    });

    const userUpdate = vi.fn();
    const refreshTokenUpdateMany = vi.fn();

    vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
      const tx = {
        passwordReset: {
          findUnique: resetFindUnique,
          updateMany: resetUpdateMany,
        },
        user: {
          update: userUpdate,
        },
        refreshToken: {
          updateMany: refreshTokenUpdateMany,
        },
      };

      return callback(tx as never);
    });

    await expect(
      consumePasswordResetAndUpdatePassword("hashed-reset-token", "hashed-password"),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid or expired reset token",
    });

    expect(userUpdate).not.toHaveBeenCalled();
    expect(refreshTokenUpdateMany).not.toHaveBeenCalled();
  });

  it("propagates transaction errors", async () => {
    vi.spyOn(prisma, "$transaction").mockRejectedValue(new Error("Database unavailable"));

    await expect(
      consumePasswordResetAndUpdatePassword("hashed-reset-token", "hashed-password"),
    ).rejects.toThrow("Database unavailable");
  });
});
