"use client";

import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Input from "@/components/ui/input";
import { forgotPassword } from "@/features/auth/auth-api";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/features/auth/auth.schemas";
import type { ApiErrorResponse } from "@/features/auth/auth.types";

const defaultValues: ForgotPasswordInput = {
  email: "",
};

export default function ForgotPasswordForm() {
  const [successMessage, setSuccessMessage] = useState("");

  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues,
  });

  const onSubmit = async (formData: ForgotPasswordInput) => {
    setSuccessMessage("");

    try {
      const response = await forgotPassword(formData.email);

      setSubmittedEmail(formData.email);
      setSuccessMessage(response.message);
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const responseData = error.response?.data;

        const emailError = responseData?.data?.email;

        if (emailError) {
          setError("email", {
            type: "server",
            message: emailError,
          });

          return;
        }

        setError("root.server", {
          type: "server",
          message: responseData?.message ?? "Unable to request a password reset.",
        });

        return;
      }

      setError("root.server", {
        type: "server",
        message: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const handleTryAgain = () => {
    setSuccessMessage("");
    setSubmittedEmail("");
    reset();
  };

  if (successMessage) {
    return (
      <section className="space-y-5 text-center">
        <div>
          <h1 className="text-2xl font-bold">Check your email</h1>

          <p className="mt-2 muted-text">{successMessage}</p>
        </div>

        <p>Password reset instructions were requested for:</p>

        <p className="font-semibold">{submittedEmail}</p>

        <p className="text-sm muted-text">
          Check your inbox and spam folder. The reset link expires after 15 minutes.
        </p>

        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full"
        >
          Open Gmail
        </a>

        <button type="button" onClick={handleTryAgain} className="btn-secondary w-full">
          Try another email
        </button>

        <Link
          href="/login"
          className="inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          Return to login
        </Link>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <h1 className="text-2xl font-bold">Forgot your password?</h1>

        <p className="mt-2 muted-text">
          Enter your email and we will send password-reset instructions.
        </p>
      </div>

      <Input
        label="Email"
        id="email"
        type="email"
        placeholder="Enter your email"
        autoComplete="email"
        disabled={isSubmitting}
        error={errors.email?.message}
        {...register("email")}
      />

      {errors.root?.server?.message && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {errors.root.server.message}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending reset link..." : "Send reset link"}
      </button>

      <p className="text-center text-sm">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-blue-700 hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
