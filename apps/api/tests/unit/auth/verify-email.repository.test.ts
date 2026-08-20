import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../src/config/prisma";

import {
  consumeEmailVerification,
  findEmailVerificationByToken,
} from "../../../src/modules/auth/auth.repository";

describe("verify email repository", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("finds an email verification by token hash", async () => {
    const expectedVerification = {
      id: "verification-1",
      userId: "user-1",
      tokenHash: "hashed-token",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
    };

    const spy = vi
      .spyOn(prisma.emailVerification, "findUnique")
      .mockResolvedValue(expectedVerification as never);

    const result = await findEmailVerificationByToken("hashed-token");

    expect(spy).toHaveBeenCalledWith({
      where: {
        tokenHash: "hashed-token",
      },
    });

    expect(result).toEqual(expectedVerification);
  });

  it("consumes verification and verifies the user atomically", async () => {
    const updateMany = vi.fn().mockResolvedValue({
      count: 1,
    });

    const userUpdate = vi.fn().mockResolvedValue({
      id: "user-1",
      isEmailVerified: true,
    });

    const transactionSpy = vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
      const tx = {
        emailVerification: {
          updateMany,
        },
        user: {
          update: userUpdate,
        },
      };

      return callback(tx as never);
    });

    await consumeEmailVerification("user-1", "verification-1");

    expect(transactionSpy).toHaveBeenCalledTimes(1);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "verification-1",
        userId: "user-1",
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
        isEmailVerified: true,
      },
    });
  });

  it("rejects when the verification token cannot be consumed", async () => {
    const updateMany = vi.fn().mockResolvedValue({
      count: 0,
    });

    const userUpdate = vi.fn();

    vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
      const tx = {
        emailVerification: {
          updateMany,
        },
        user: {
          update: userUpdate,
        },
      };

      return callback(tx as never);
    });

    await expect(consumeEmailVerification("user-1", "verification-1")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid or expired verification token",
    });

    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("propagates transaction errors", async () => {
    vi.spyOn(prisma, "$transaction").mockRejectedValue(new Error("Database unavailable"));

    await expect(consumeEmailVerification("user-1", "verification-1")).rejects.toThrow(
      "Database unavailable",
    );
  });
});
