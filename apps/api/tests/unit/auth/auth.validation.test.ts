import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "../../../src/modules/auth/auth.validation";

describe("registerSchema", () => {
  it("should accept valid registration data", () => {
    const result = registerSchema.safeParse({
      username: "karthik",
      displayName: "Karthik Reddy",
      email: "karthik@gmail.com",
      password: "strongpassword123",
    });

    expect(result.success).toBe(true);
  });

  it("should reject username shorter than 3 characters", () => {
    const result = registerSchema.safeParse({
      username: "ka",
      displayName: "Karthik",
      email: "karthik@gmail.com",
      password: "strongpassword123",
    });

    expect(result.success).toBe(false);
  });

  it("should reject username longer than 30 characters", () => {
    const result = registerSchema.safeParse({
      username: "karthikreddykarthikreddykarthikreddy",
      displayName: "Karthik",
      email: "karthik@gmail.com",
      password: "strongpassword123",
    });

    expect(result.success).toBe(false);
  });

  it("should reject empty username", () => {
    const result = registerSchema.safeParse({
      username: "",
      displayName: "Karthik",
      email: "karthik@gmail.com",
      password: "strongpassword123",
    });

    expect(result.success).toBe(false);
  });

  it("should reject empty displayName", () => {
    const result = registerSchema.safeParse({
      username: "Karthik",
      displayName: "",
      email: "karthik@gmail.com",
      password: "strongpassword123",
    });

    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = registerSchema.safeParse({
      username: "karthik",
      displayName: "Karthik Reddy",
      email: "wrong-email",
      password: "strongpassword123",
    });

    expect(result.success).toBe(false);
  });

  it("should reject empty email", () => {
    const result = registerSchema.safeParse({
      username: "Karthik",
      displayName: "Karthik",
      email: "",
      password: "strongpassword123",
    });

    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const result = registerSchema.safeParse({
      username: "Karthik",
      displayName: "Karthik",
      email: "karthik@gmail.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });

  it("should reject password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      username: "Karthik",
      displayName: "Karthik",
      email: "karthik@gmail.com",
      password: "123456",
    });

    expect(result.success).toBe(false);
  });

  it("should reject password longer than 50 characters", () => {
    const result = registerSchema.safeParse({
      username: "Karthik",
      displayName: "Karthik",
      email: "karthik@gmail.com",
      password: "123456789012345678901234567890123456789012345678901234567890",
    });

    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("should accept valid login data", () => {
    const result = loginSchema.safeParse({
      email: "karthik@gmail.com",
      password: "strongpassword123",
    });

    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "wrong-email",
      password: "strongpassword123",
    });

    expect(result.success).toBe(false);
  });

  it("should reject empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "strongpassword123",
    });

    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({
      email: "karthik@gmail.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});
