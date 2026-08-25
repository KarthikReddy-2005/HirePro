"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Input from "@/components/ui/input";
import { registerUser } from "@/features/auth/auth-api";
import { registerSchema, type RegisterInput } from "@/features/auth/auth.schemas";
import type { ApiErrorResponse } from "@/features/auth/auth.types";

const defaultValues: RegisterInput = {
  username: "",
  displayName: "",
  email: "",
  password: "",
};

export default function RegisterForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues,
  });

  const onSubmit = async (formData: RegisterInput) => {
    try {
      await registerUser(formData);

      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const responseData = error.response?.data;
        const fieldErrors = responseData?.data;

        if (fieldErrors) {
          const supportedFields = ["username", "displayName", "email", "password"] as const;

          let fieldErrorWasSet = false;

          for (const field of supportedFields) {
            const message = fieldErrors[field];

            if (message) {
              setError(field, {
                type: "server",
                message,
              });

              fieldErrorWasSet = true;
            }
          }

          if (fieldErrorWasSet) {
            return;
          }
        }

        if (
          responseData?.statusCode === 409 &&
          responseData.message === "Username already exists"
        ) {
          setError("username", {
            type: "server",
            message: responseData.message,
          });

          return;
        }

        if (responseData?.statusCode === 409 && responseData.message === "Email already exists") {
          setError("email", {
            type: "server",
            message: responseData.message,
          });

          return;
        }

        setError("root.server", {
          type: "server",
          message: responseData?.message ?? "Registration failed. Please try again.",
        });

        return;
      }

      setError("root.server", {
        type: "server",
        message: "An unexpected error occurred. Please try again.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <h1 className="text-2xl font-bold">Create an account</h1>

        <p className="mt-2 muted-text">Enter your details to create your HirePro account.</p>
      </div>

      <Input
        label="Username"
        id="username"
        type="text"
        placeholder="Choose a username"
        autoComplete="username"
        disabled={isSubmitting}
        error={errors.username?.message}
        {...register("username")}
      />

      <Input
        label="Display name"
        id="displayName"
        type="text"
        placeholder="Enter your display name"
        autoComplete="name"
        disabled={isSubmitting}
        error={errors.displayName?.message}
        {...register("displayName")}
      />

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

      <Input
        label="Password"
        id="password"
        type="password"
        placeholder="Create a password"
        autoComplete="new-password"
        disabled={isSubmitting}
        error={errors.password?.message}
        {...register("password")}
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
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-blue-700 hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
