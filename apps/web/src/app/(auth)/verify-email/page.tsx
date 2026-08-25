import { Suspense } from "react";

import VerifyEmail from "@/components/auth/verify-email";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="text-center muted-text">Loading verification...</p>}>
      <VerifyEmail />
    </Suspense>
  );
}
