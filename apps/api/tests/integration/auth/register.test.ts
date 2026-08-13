import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../src/app";

describe("POST /api/v1/auth/register", () => {
  it("should register a new user", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        username: `testuser_${Date.now()}`,
        displayName: "Test User",
        email: `test_${Date.now()}@gmail.com`,
        password: "strongpassword123",
      });

    expect(response.status).toBe(201);

    expect(response.body.message).toBe("User created successfully");

    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data).toHaveProperty("username");
    expect(response.body.data).toHaveProperty("email");
    expect(response.body.data).toHaveProperty("isEmailVerified");

    expect(response.body.data).not.toHaveProperty("hashedPassword");
  });

  it("should reject an already registered email", async () => {
    const email = `duplicate_${Date.now()}@gmail.com`;

    await request(app)
      .post("/api/v1/auth/register")
      .send({
        username: `user_${Date.now()}`,
        displayName: "Test User",
        email,
        password: "strongpassword123",
      });

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        username: `another_${Date.now()}`,
        displayName: "Another User",
        email,
        password: "strongpassword123",
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Email already exist");
  });

  it("should reject an already registered username", async () => {
    const username = `duplicate_${Date.now()}`;

    await request(app)
      .post("/api/v1/auth/register")
      .send({
        username,
        displayName: "First User",
        email: `first_${Date.now()}@gmail.com`,
        password: "strongpassword123",
      });

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        username,
        displayName: "Second User",
        email: `second_${Date.now()}@gmail.com`,
        password: "strongpassword123",
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Username already exist");
  });

  it("should reject invalid registration data", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      username: "ab",
      displayName: "",
      email: "invalid-email",
      password: "123",
    });

    expect(response.status).toBe(400);
  });
});
