import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../src/config/prisma";

import {
  createPasswordReset,
  findPasswordResetByToken,
  findUserByEmail,
} from "../../../src/modules/auth/auth.repository";

describe("forgot password repository", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("finds a user by email", async () => {
    const expectedUser = {
      id: "user-1",
    };

    const spy = vi.spyOn(prisma.user, "findUnique").mockResolvedValue(expectedUser as never);

    const result = await findUserByEmail("karthik@example.com");

    expect(spy).toHaveBeenCalledWith({
      where: {
        email: "karthik@example.com",
      },
      select: {
        id: true,
      },
    });

    expect(result).toEqual(expectedUser);
  });

  it("returns null when the user does not exist", async () => {
    const spy = vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

    const result = await findUserByEmail("unknown@example.com");

    expect(result).toBeNull();

    expect(spy).toHaveBeenCalledWith({
      where: {
        email: "unknown@example.com",
      },
      select: {
        id: true,
      },
    });
  });

  it("creates a password reset token", async () => {
    const resetToken = {
      id: "reset-1",
      userId: "user-1",
      tokenHash: "hashed-reset-token",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
    };

    const spy = vi.spyOn(prisma.passwordReset, "create").mockResolvedValue(resetToken as never);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const result = await createPasswordReset({
      userId: "user-1",
      tokenHash: "hashed-reset-token",
      expiresAt,
    });

    expect(spy).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        tokenHash: "hashed-reset-token",
        expiresAt,
      },
    });

    expect(result).toEqual(resetToken);
  });

  it("finds a password reset token by its hash", async () => {
    const expectedReset = {
      id: "reset-1",
      userId: "user-1",
      tokenHash: "hashed-reset-token",
      expiresAt: new Date(),
      usedAt: null,
      createdAt: new Date(),
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

  it("propagates password reset creation errors", async () => {
    vi.spyOn(prisma.passwordReset, "create").mockRejectedValue(new Error("Database unavailable"));

    await expect(
      createPasswordReset({
        userId: "user-1",
        tokenHash: "hashed-reset-token",
        expiresAt: new Date(),
      }),
    ).rejects.toThrow("Database unavailable");
  });
});
