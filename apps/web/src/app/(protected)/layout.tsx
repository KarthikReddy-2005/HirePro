"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthProvider, useAuth } from "@/features/auth/auth-context";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AuthProvider>
      <ProtectedApp>{children}</ProtectedApp>
    </AuthProvider>
  );
}

function ProtectedApp({ children }: AppLayoutProps) {
  const router = useRouter();

  const { status, loadUser } = useAuth();

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div role="status" className="space-y-3 text-center">
          <div
            className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent"
            aria-hidden="true"
          />

          <p className="muted-text">Loading your account...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <main>{children}</main>;
}
