import type { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken";

import { beforeEach, describe, expect, it, vi } from "vitest";

import protectedRoute from "../../../src/middlewares/auth.middleware";

import { findUserById } from "../../../src/modules/auth/auth.repository";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("../../../src/modules/auth/auth.repository", () => ({
  findUserById: vi.fn(),
}));

describe("protectedRoute middleware", () => {
  const verifiedUser = {
    id: "user-1",
    username: "karthik",
    displayName: "Karthik",
    email: "karthik@example.com",
    avatarUrl: null,
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createRequest = (accessToken?: string): Request & { user?: typeof verifiedUser } => {
    return {
      cookies: accessToken
        ? {
            accessToken,
          }
        : {},
    } as Request;
  };

  const createResponse = (): Response => {
    return {} as Response;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(jwt.verify).mockReturnValue({
      userId: "user-1",
    } as never);

    vi.mocked(findUserById).mockResolvedValue(verifiedUser);
  });

  it("authenticates a valid access token", async () => {
    const req = createRequest("valid-access-token");

    const res = createResponse();

    const next: NextFunction = vi.fn();

    await protectedRoute(req, res, next);

    expect(jwt.verify).toHaveBeenCalledTimes(1);

    expect(jwt.verify).toHaveBeenCalledWith("valid-access-token", expect.any(String));

    expect(findUserById).toHaveBeenCalledTimes(1);

    expect(findUserById).toHaveBeenCalledWith("user-1");

    expect(req.user).toEqual(verifiedUser);

    expect(next).toHaveBeenCalledTimes(1);

    expect(next).toHaveBeenCalledWith();
  });

  it("rejects a missing access token", async () => {
    const req = createRequest();

    const res = createResponse();

    const next: NextFunction = vi.fn();

    await protectedRoute(req, res, next);

    expect(jwt.verify).not.toHaveBeenCalled();

    expect(findUserById).not.toHaveBeenCalled();

    expect(next).toHaveBeenCalledTimes(1);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Unauthorized! Access denied",
      }),
    );

    expect(req.user).toBeUndefined();
  });

  it("rejects an invalid access token", async () => {
    vi.mocked(jwt.verify).mockImplementation(function verifyInvalidToken() {
      throw new Error("Invalid token");
    });

    const req = createRequest("invalid-token");

    const res = createResponse();

    const next: NextFunction = vi.fn();

    await protectedRoute(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("invalid-token", expect.any(String));

    expect(findUserById).not.toHaveBeenCalled();

    expect(next).toHaveBeenCalledTimes(1);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Unauthorized! Access denied",
      }),
    );

    expect(req.user).toBeUndefined();
  });

  it("rejects an expired access token", async () => {
    vi.mocked(jwt.verify).mockImplementation(function verifyExpiredToken() {
      const error = new Error("jwt expired");

      error.name = "TokenExpiredError";

      throw error;
    });

    const req = createRequest("expired-token");

    const res = createResponse();

    const next: NextFunction = vi.fn();

    await protectedRoute(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("expired-token", expect.any(String));

    expect(findUserById).not.toHaveBeenCalled();

    expect(next).toHaveBeenCalledTimes(1);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Unauthorized! Access denied",
      }),
    );

    expect(req.user).toBeUndefined();
  });

  it("rejects a token for a user that does not exist", async () => {
    vi.mocked(findUserById).mockResolvedValue(null);

    const req = createRequest("valid-access-token");

    const res = createResponse();

    const next: NextFunction = vi.fn();

    await protectedRoute(req, res, next);

    expect(jwt.verify).toHaveBeenCalledTimes(1);

    expect(findUserById).toHaveBeenCalledWith("user-1");

    expect(next).toHaveBeenCalledTimes(1);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Unauthorized! Access denied",
      }),
    );

    expect(req.user).toBeUndefined();
  });

  it("rejects an unverified user", async () => {
    vi.mocked(findUserById).mockResolvedValue({
      ...verifiedUser,
      isEmailVerified: false,
    });

    const req = createRequest("valid-access-token");

    const res = createResponse();

    const next: NextFunction = vi.fn();

    await protectedRoute(req, res, next);

    expect(jwt.verify).toHaveBeenCalledTimes(1);

    expect(findUserById).toHaveBeenCalledWith("user-1");

    expect(next).toHaveBeenCalledTimes(1);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Unauthorized! Access denied",
      }),
    );

    expect(req.user).toBeUndefined();
  });

  it("rejects a decoded token without a userId", async () => {
    vi.mocked(jwt.verify).mockReturnValue({} as never);

    const req = createRequest("token-without-user-id");
    const res = createResponse();
    const next: NextFunction = vi.fn();

    await protectedRoute(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("token-without-user-id", expect.any(String));

    expect(findUserById).not.toHaveBeenCalled();

    expect(next).toHaveBeenCalledTimes(1);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Unauthorized! Access denied",
      }),
    );

    expect(req.user).toBeUndefined();
  });

  it("forwards repository errors to the error middleware", async () => {
    vi.mocked(findUserById).mockRejectedValue(new Error("Database unavailable"));

    const req = createRequest("valid-access-token");

    const res = createResponse();

    const next: NextFunction = vi.fn();

    await protectedRoute(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Database unavailable",
      }),
    );

    expect(req.user).toBeUndefined();
  });
});
