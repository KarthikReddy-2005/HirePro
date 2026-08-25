"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Input from "@/components/ui/input";
import { loginUser } from "@/features/auth/auth-api";
import { loginSchema, type LoginInput } from "@/features/auth/auth.schemas";
import type { ApiErrorResponse } from "@/features/auth/auth.types";

const defaultValues: LoginInput = {
  email: "",
  password: "",
};

export default function LoginForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues,
  });

  const onSubmit = async (formData: LoginInput) => {
    try {
      await loginUser(formData);

      router.replace("/dashboard");
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setError("root.server", {
          type: "server",
          message: error.response?.data.message ?? "Login failed. Please try again.",
        });

        return;
      }

      setError("root.server", {
        type: "server",
        message: "An unexpected error occurred. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <h1 className="text-2xl font-bold">Login to your account</h1>

        <p className="mt-2 muted-text">Enter your details to continue to HirePro.</p>
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

      <Input
        label="Password"
        id="password"
        type="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        disabled={isSubmitting}
        error={errors.password?.message}
        {...register("password")}
      />

      <div className="text-right">
        <Link href="/forgot-password" className="text-sm font-medium text-blue-700 hover:underline">
          Forgot password?
        </Link>
      </div>

      {errors.root?.server?.message && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {errors.root.server.message}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>

      <p className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-blue-700 hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
