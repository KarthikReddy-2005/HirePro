import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../../../src/config/prisma";
import { revokeRefreshToken } from "../../../src/modules/auth/auth.repository";

describe("revokeRefreshToken", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("revokes only an active refresh token", async () => {
    const updateManySpy = vi.spyOn(prisma.refreshToken, "updateMany").mockResolvedValue({
      count: 1,
    });

    await revokeRefreshToken("refresh-token-1");

    expect(updateManySpy).toHaveBeenCalledTimes(1);

    expect(updateManySpy).toHaveBeenCalledWith({
      where: {
        id: "refresh-token-1",
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
  });

  it("returns count 0 when the token is already revoked", async () => {
    const updateManySpy = vi.spyOn(prisma.refreshToken, "updateMany").mockResolvedValue({
      count: 0,
    });

    const result = await revokeRefreshToken("already-revoked-token");

    expect(result.count).toBe(0);

    expect(updateManySpy).toHaveBeenCalledWith({
      where: {
        id: "already-revoked-token",
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
  });
});
