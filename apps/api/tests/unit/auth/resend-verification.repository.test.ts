import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../src/config/prisma";

import {
  createEmailVerification,
  findUserForVerification,
  invalidateEmailVerifications,
} from "../../../src/modules/auth/auth.repository";

describe("resend verification repository", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("finds the verification user by email", async () => {
    const expectedUser = {
      id: "user-1",
      email: "karthik@example.com",
      isEmailVerified: false,
    };

    const findUniqueSpy = vi
      .spyOn(prisma.user, "findUnique")
      .mockResolvedValue(expectedUser as never);

    const result = await findUserForVerification("karthik@example.com");

    expect(findUniqueSpy).toHaveBeenCalledWith({
      where: {
        email: "karthik@example.com",
      },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
      },
    });

    expect(result).toEqual(expectedUser);
  });

  it("returns null when the verification user does not exist", async () => {
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

    const result = await findUserForVerification("unknown@example.com");

    expect(result).toBeNull();
  });

  it("invalidates all unused verification tokens for the user", async () => {
    const updateManySpy = vi.spyOn(prisma.emailVerification, "updateMany").mockResolvedValue({
      count: 2,
    });

    const result = await invalidateEmailVerifications("user-1");

    expect(updateManySpy).toHaveBeenCalledTimes(1);

    expect(updateManySpy).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        usedAt: null,
      },
      data: {
        usedAt: expect.any(Date),
      },
    });

    expect(result).toEqual({
      count: 2,
    });
  });

  it("creates a new email verification token", async () => {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const expectedVerification = {
      id: "verification-1",
      userId: "user-1",
      tokenHash: "hashed-token",
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    };

    const createSpy = vi
      .spyOn(prisma.emailVerification, "create")
      .mockResolvedValue(expectedVerification as never);

    const result = await createEmailVerification({
      userId: "user-1",
      tokenHash: "hashed-token",
      expiresAt,
    });

    expect(createSpy).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        tokenHash: "hashed-token",
        expiresAt,
      },
    });

    expect(result).toEqual(expectedVerification);
  });

  it("propagates token invalidation errors", async () => {
    vi.spyOn(prisma.emailVerification, "updateMany").mockRejectedValue(
      new Error("Database unavailable"),
    );

    await expect(invalidateEmailVerifications("user-1")).rejects.toThrow("Database unavailable");
  });

  it("propagates token creation errors", async () => {
    vi.spyOn(prisma.emailVerification, "create").mockRejectedValue(
      new Error("Database unavailable"),
    );

    await expect(
      createEmailVerification({
        userId: "user-1",
        tokenHash: "hashed-token",
        expiresAt: new Date(),
      }),
    ).rejects.toThrow("Database unavailable");
  });
});
