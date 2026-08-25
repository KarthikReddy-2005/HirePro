import { apiClient } from "@/lib/api-client";

import type { ApiResponse, LoginInput, RegisterInput, User } from "./auth.types";

export async function registerUser(input: RegisterInput): Promise<ApiResponse<User>> {
  const response = await apiClient.post<ApiResponse<User>>("/auth/register", input);
  return response.data;
}

export async function loginUser(input: LoginInput): Promise<ApiResponse<User>> {
  const response = await apiClient.post<ApiResponse<User>>("/auth/login", input);
  return response.data;
}

export async function verifyEmail(token: string): Promise<ApiResponse<null>> {
  const response = await apiClient.get<ApiResponse<null>>("/auth/verify-email", {
    params: { token },
  });
  return response.data;
}

export async function resendEmail(email: string): Promise<ApiResponse<null>> {
  const response = await apiClient.post<ApiResponse<null>>("/auth/resend-verification", { email });
  return response.data;
}

export async function getMe(): Promise<ApiResponse<User>> {
  const response = await apiClient.get<ApiResponse<User>>("/auth/me");
  return response.data;
}

export async function forgotPassword(email: string): Promise<ApiResponse<null>> {
  const response = await apiClient.post<ApiResponse<null>>("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPassword(token: string, password: string): Promise<ApiResponse<null>> {
  const response = await apiClient.post<ApiResponse<null>>(
    "/auth/reset-password",
    { password },
    { params: { token } },
  );
  return response.data;
}

export async function logoutUser(): Promise<ApiResponse<null>> {
  const response = await apiClient.post<ApiResponse<null>>("/auth/logout");
  return response.data;
}