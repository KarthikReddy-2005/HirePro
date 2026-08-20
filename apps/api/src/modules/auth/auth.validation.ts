import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),

  displayName: z
    .string()
    .trim()
    .min(3, "Display name must be at least 3 characters")
    .max(30, "Display name must not exceed 30 characters"),

  email: z.email("Invalid email address").transform((email) => email.trim().toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must not exceed 50 characters"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address").trim().toLowerCase(),

  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("If an account exists with this email, a reset link has been sent."),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must not exceed 50 characters"),
});