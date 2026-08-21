import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../src/config/prisma";

import { findPasswordByEmail, findUserById } from "../../../src/modules/auth/auth.repository";

describe("login repository", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("finds password data by email", async () => {
    const expectedData = {
      id: "user-1",
      hashedPassword: "hashed-password",
      isEmailVerified: true,
    };

    const spy = vi.spyOn(prisma.user, "findUnique").mockResolvedValue(expectedData as never);

    const result = await findPasswordByEmail("karthik@example.com");

    expect(spy).toHaveBeenCalledWith({
      where: {
        email: "karthik@example.com",
      },
      select: {
        id: true,
        hashedPassword: true,
        isEmailVerified: true,
      },
    });

    expect(result).toEqual(expectedData);
  });

  it("returns null when the login user does not exist", async () => {
    const spy = vi.spyOn(prisma.user, "findUnique").mockResolvedValue(null);

    const result = await findPasswordByEmail("unknown@example.com");

    expect(result).toBeNull();

    expect(spy).toHaveBeenCalledWith({
      where: {
        email: "unknown@example.com",
      },
      select: {
        id: true,
        hashedPassword: true,
        isEmailVerified: true,
      },
    });
  });

  it("finds the public user by id", async () => {
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

    const spy = vi.spyOn(prisma.user, "findUnique").mockResolvedValue(expectedUser as never);

    const result = await findUserById("user-1");

    expect(spy).toHaveBeenCalledWith({
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
});
