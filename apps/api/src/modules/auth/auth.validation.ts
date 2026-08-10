import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters"),

  displayName: z
    .string()
    .trim()
    .min(3, "DisplayName must be at least 3 characters")
    .max(30, "DisplayName must not exceed 30 characters"),

  email: z.email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must not exceed 50 characters"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),

  password: z.string().min(1, "Password is required"),
});
