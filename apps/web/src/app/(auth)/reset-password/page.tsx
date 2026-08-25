import type { Metadata } from "next";
import { Suspense } from "react";

import ResetPasswordForm from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Create a new HirePro password",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-center muted-text">Loading reset form...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
