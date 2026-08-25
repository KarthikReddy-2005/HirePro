"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { resendEmail, verifyEmail } from "@/features/auth/auth-api";

import type { ApiErrorResponse } from "@/features/auth/auth.types";

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const verificationStarted = useRef(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  const [resending, setResending] = useState(false);

  const [resendMessage, setResendMessage] = useState("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;

    async function triggerVerification() {
      setLoading(true);
      setError("");
      if (typeof token === "string") {
        try {
          await verifyEmail(token);

          setSuccess(true);

          redirectTimer.current = setTimeout(() => {
            router.replace("/login");
          }, 2000);
        } catch (error: unknown) {
          if (axios.isAxiosError<ApiErrorResponse>(error)) {
            setError(
              error.response?.data.message ?? "Verification failed. The link may have expired.",
            );
          } else {
            setError("An unexpected error occurred while verifying your email.");
          }
        } finally {
          setLoading(false);
        }
      }
    }

    triggerVerification();

    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, [token, router]);

  const handleResend = async () => {
    if (!email || resending) {
      return;
    }

    setResending(true);
    setError("");
    setResendMessage("");

    try {
      const response = await resendEmail(email);

      setResendMessage(response.message);
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setError(error.response?.data.message ?? "Unable to resend the verification email.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setResending(false);
    }
  };

  if (token) {
    return (
      <section className="space-y-4 p-6 text-center">
        {loading && (
          <>
            <h1 className="text-2xl font-bold">Verifying your email</h1>

            <p className="muted-text">Please wait while we verify your account.</p>
          </>
        )}

        {success && (
          <>
            <h1 className="text-2xl font-bold text-green-700">Email verified</h1>

            <p>Your account has been verified successfully.</p>

            <p className="muted-text">Redirecting you to login...</p>
          </>
        )}

        {error && (
          <>
            <h1 className="text-2xl font-bold text-red-700">Verification failed</h1>

            <p role="alert" className="text-red-600">
              {error}
            </p>

            <a href="/login" className="btn-secondary">
              Go to login
            </a>
          </>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-5 p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Check your email</h1>
      </div>

      {email && (
        <p>
          Verification email sent to: <strong>{email}</strong>
        </p>
      )}

      <p>Open the email and click the verification link to activate your account.</p>

      <a
        href="https://mail.google.com"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary"
      >
        Open Gmail
      </a>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {resendMessage && (
        <p role="status" className="text-sm text-green-700">
          {resendMessage}
        </p>
      )}

      {email ? (
        <p>
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-blue-700 underline disabled:opacity-60"
          >
            {resending ? "Sending..." : "Resend verification email"}
          </button>
        </p>
      ) : (
        <p className="text-sm text-red-600">Email address is missing. Please register again.</p>
      )}
    </section>
  );
}
