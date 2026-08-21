import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../src/config/prisma";
import {
  createUserWithEmailVerification,
  findUserByEmail,
  findUserByUsername,
} from "../../../src/modules/auth/auth.repository";

describe("register repository", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("finds a user by username", async () => {
    const expectedUser = {
      id: "user-1",
      username: "karthik",
    };

    const spy = vi.spyOn(prisma.user, "findUnique").mockResolvedValue(expectedUser as never);

    const result = await findUserByUsername("karthik");

    expect(spy).toHaveBeenCalledWith({
      where: {
        username: "karthik",
      },
    });

    expect(result).toEqual(expectedUser);
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

  it("creates user and email verification atomically", async () => {
    const transactionSpy = vi.spyOn(prisma, "$transaction").mockImplementation(async (callback) => {
      const tx = {
        user: {
          create: vi.fn().mockResolvedValue({
            id: "user-1",
            username: "karthik",
            displayName: "Karthik",
            email: "karthik@example.com",
            avatarUrl: null,
            isEmailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        emailVerification: {
          create: vi.fn().mockResolvedValue({
            id: "verification-1",
          }),
        },
      };

      return callback(tx as never);
    });

    const result = await createUserWithEmailVerification({
      username: "karthik",
      displayName: "Karthik",
      email: "karthik@example.com",
      hashedPassword: "hashed-password",
      tokenHash: "hashed-token",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    expect(transactionSpy).toHaveBeenCalledTimes(1);

    expect(result).toMatchObject({
      id: "user-1",
      username: "karthik",
      email: "karthik@example.com",
    });
  });

  it("propagates transaction errors", async () => {
    vi.spyOn(prisma, "$transaction").mockRejectedValue(new Error("Database unavailable"));

    await expect(
      createUserWithEmailVerification({
        username: "karthik",
        displayName: "Karthik",
        email: "karthik@example.com",
        hashedPassword: "hashed-password",
        tokenHash: "hashed-token",
        expiresAt: new Date(),
      }),
    ).rejects.toThrow("Database unavailable");
  });
});
