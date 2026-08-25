"use client";

import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Input from "@/components/ui/input";
import { resetPassword } from "@/features/auth/auth-api";
import { resetPasswordSchema, type ResetPasswordInput } from "@/features/auth/auth.schemas";
import type { ApiErrorResponse } from "@/features/auth/auth.types";

const defaultValues: ResetPasswordInput = {
  password: "",
  confirmPassword: "",
};

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues,
  });

  const onSubmit = async (formData: ResetPasswordInput) => {
    if (!token) {
      setError("root.server", {
        type: "server",
        message: "The password-reset token is missing.",
      });

      return;
    }

    setSuccessMessage("");

    try {
      const response = await resetPassword(token, formData.password);

      reset();
      setSuccessMessage(response.message);
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const responseData = error.response?.data;

        const passwordError = responseData?.data?.password;

        if (passwordError) {
          setError("password", {
            type: "server",
            message: passwordError,
          });

          return;
        }

        setError("root.server", {
          type: "server",
          message: responseData?.message ?? "Unable to reset your password.",
        });

        return;
      }

      setError("root.server", {
        type: "server",
        message: "An unexpected error occurred. Please try again.",
      });
    }
  };

  if (!token) {
    return (
      <section className="space-y-5 text-center">
        <h1 className="text-2xl font-bold">Invalid reset link</h1>

        <p role="alert" className="text-red-600">
          The password-reset token is missing.
        </p>

        <p className="muted-text">Request a new password-reset link and try again.</p>

        <Link href="/forgot-password" className="btn-primary w-full">
          Request new link
        </Link>
      </section>
    );
  }

  if (successMessage) {
    return (
      <section className="space-y-5 text-center">
        <h1 className="text-2xl font-bold text-green-700">Password updated</h1>

        <p role="status">{successMessage}</p>

        <p className="muted-text">You can now log in using your new password.</p>

        <Link href="/login" className="btn-primary w-full">
          Continue to login
        </Link>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <h1 className="text-2xl font-bold">Create a new password</h1>

        <p className="mt-2 muted-text">Enter and confirm your new password.</p>
      </div>

      <Input
        label="New password"
        id="password"
        type="password"
        placeholder="Enter a new password"
        autoComplete="new-password"
        disabled={isSubmitting}
        error={errors.password?.message}
        {...register("password")}
      />

      <Input
        label="Confirm password"
        id="confirmPassword"
        type="password"
        placeholder="Enter the password again"
        autoComplete="new-password"
        disabled={isSubmitting}
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
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
        {isSubmitting ? "Updating password..." : "Reset password"}
      </button>
    </form>
  );
}
