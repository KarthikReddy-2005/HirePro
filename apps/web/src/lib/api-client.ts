import axios, { type InternalAxiosRequestConfig } from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is missing");
}

const baseURL = `${apiUrl}/api/v1`;

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10_000,
});

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10_000,
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<void> | null = null;

const publicAuthEndpoints = [
  "/auth/register",
  "/auth/login",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/refresh",
];

function shouldSkipRefresh(url: string | undefined): boolean {
  if (!url) {
    return true;
  }

  return publicAuthEndpoints.some((endpoint) => url.includes(endpoint));
}

apiClient.interceptors.response.use(
  (response) => response,

  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      /*
       * If several requests fail together, all of
       * them wait for the same refresh request.
       */
      refreshPromise ??= refreshClient
        .post("/auth/refresh")
        .then(() => undefined)
        .finally(() => {
          refreshPromise = null;
        });

      await refreshPromise;

      /*
       * The browser now has the new access-token
       * cookie, so retry the original request.
       */
      return apiClient(originalRequest);
    } catch (refreshError: unknown) {
      return Promise.reject(refreshError);
    }
  },
);
