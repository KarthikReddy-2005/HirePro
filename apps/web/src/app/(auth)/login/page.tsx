import type { Metadata } from "next";

import LoginForm from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Login into your HirePro account",
};

export default function LoginPage() {
  return <LoginForm />;
}
