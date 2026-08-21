import { beforeEach, describe, expect, it, vi } from "vitest";

import { findPasswordByEmail, findUserById } from "../../../src/modules/auth/auth.repository";

import { comparePassword } from "../../../src/utils/password";

import { loginService } from "../../../src/modules/auth/auth.service";

vi.mock("../../../src/modules/auth/auth.repository", () => ({
  findUserByEmail: vi.fn(),
  findUserByUsername: vi.fn(),
  createUserWithEmailVerification: vi.fn(),
  findPasswordByEmail: vi.fn(),
  findUserById: vi.fn(),
  findEmailVerificationByToken: vi.fn(),
  consumeEmailVerification: vi.fn(),
  createEmailVerification: vi.fn(),
  invalidateEmailVerifications: vi.fn(),
  createPasswordReset: vi.fn(),
  findPasswordResetByToken: vi.fn(),
  consumePasswordResetAndUpdatePassword: vi.fn(),
  findRefreshTokenByHash: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

vi.mock("../../../src/utils/password", () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));

describe("loginService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(findPasswordByEmail).mockResolvedValue({
      id: "user-1",
      hashedPassword: "hashed-password",
      isEmailVerified: true,
    });

    vi.mocked(comparePassword).mockResolvedValue(true);

    vi.mocked(findUserById).mockResolvedValue({
      id: "user-1",
      username: "karthik",
      displayName: "Karthik",
      email: "karthik@example.com",
      avatarUrl: null,
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("logs in a verified user with valid credentials", async () => {
    const result = await loginService({
      email: "karthik@example.com",
      password: "Password123",
    });

    expect(result).toMatchObject({
      id: "user-1",
      username: "karthik",
      email: "karthik@example.com",
      isEmailVerified: true,
    });

    expect(findPasswordByEmail).toHaveBeenCalledWith("karthik@example.com");

    expect(comparePassword).toHaveBeenCalledWith("Password123", "hashed-password");

    expect(findUserById).toHaveBeenCalledWith("user-1");
  });

  it("rejects login when the email does not exist", async () => {
    vi.mocked(findPasswordByEmail).mockResolvedValue(null);

    await expect(
      loginService({
        email: "unknown@example.com",
        password: "Password123",
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid email or password",
    });

    expect(comparePassword).not.toHaveBeenCalled();
    expect(findUserById).not.toHaveBeenCalled();
  });

  it("rejects login when the password is incorrect", async () => {
    vi.mocked(comparePassword).mockResolvedValue(false);

    await expect(
      loginService({
        email: "karthik@example.com",
        password: "WrongPassword",
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid email or password",
    });

    expect(findUserById).not.toHaveBeenCalled();
  });

  it("rejects login when the email is not verified", async () => {
    vi.mocked(findPasswordByEmail).mockResolvedValue({
      id: "user-1",
      hashedPassword: "hashed-password",
      isEmailVerified: false,
    });

    await expect(
      loginService({
        email: "karthik@example.com",
        password: "Password123",
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "Please verify your email before logging in",
    });

    expect(comparePassword).toHaveBeenCalledWith("Password123", "hashed-password");

    expect(findUserById).not.toHaveBeenCalled();
  });

  it("rejects login when the user no longer exists", async () => {
    vi.mocked(findUserById).mockResolvedValue(null);

    await expect(
      loginService({
        email: "karthik@example.com",
        password: "Password123",
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Unauthorized",
    });
  });

  it("uses the same error message for unknown email and incorrect password", async () => {
    vi.mocked(findPasswordByEmail).mockResolvedValue(null);

    const unknownEmailError = await loginService({
      email: "unknown@example.com",
      password: "Password123",
    }).catch((error) => error);

    vi.mocked(findPasswordByEmail).mockResolvedValue({
      id: "user-1",
      hashedPassword: "hashed-password",
      isEmailVerified: true,
    });

    vi.mocked(comparePassword).mockResolvedValue(false);

    const wrongPasswordError = await loginService({
      email: "karthik@example.com",
      password: "WrongPassword",
    }).catch((error) => error);

    expect(unknownEmailError.statusCode).toBe(401);
    expect(wrongPasswordError.statusCode).toBe(401);

    expect(unknownEmailError.message).toBe("Invalid email or password");

    expect(wrongPasswordError.message).toBe("Invalid email or password");
  });
});
