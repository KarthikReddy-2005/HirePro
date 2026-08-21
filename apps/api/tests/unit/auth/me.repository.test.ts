import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../src/config/prisma";

import { findUserById } from "../../../src/modules/auth/auth.repository";

describe("me repository", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("finds the public user profile by id", async () => {
    const expectedUser = {
      id: "user-1",
      username: "karthik",
      displayName: "Karthik",
      email: "karthik@example.com",
      avatarUrl: null,
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const findUniqueSpy = vi
      .spyOn(prisma.user, "findUnique")
      .mockResolvedValue(expectedUser as never);

    const result = await findUserById("user-1");

    expect(findUniqueSpy).toHaveBeenCalledWith({
      where: {
        id: "user-1",
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    expect(result).toEqual(expectedUser);
  });

  it("does not select the password hash", async () => {
    const findUniqueSpy = vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

    await findUserById("user-1");

    const query = findUniqueSpy.mock.calls[0][0];

    expect(query.select).not.toHaveProperty("hashedPassword");
  });

  it("returns null when the user does not exist", async () => {
    vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

    const result = await findUserById("missing-user");

    expect(result).toBeNull();
  });

  it("propagates database errors", async () => {
    vi.spyOn(prisma.user, "findUnique").mockRejectedValue(new Error("Database unavailable"));

    await expect(findUserById("user-1")).rejects.toThrow("Database unavailable");
  });
});
