"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/auth-context";

export default function DashboardPage() {
  const router = useRouter();

  const { user, logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b  border-(--border) bg-(--surface)">
        <div className="page-container flex items-center justify-between py-4">
          <h1 className="text-xl font-bold">HirePro</h1>

          <div className="flex items-center gap-4">
            <span className="text-sm">{user.displayName}</span>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="btn-secondary"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <section className="page-container py-10">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Welcome, {user.displayName}</h2>

          <p className="muted-text">Your HirePro account is ready.</p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="rounded-xl border  border-(--border) bg-(--surface) p-6">
            <h3 className="text-lg font-semibold">Account details</h3>

            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm muted-text">Display name</dt>

                <dd className="font-medium">{user.displayName}</dd>
              </div>

              <div>
                <dt className="text-sm muted-text">Username</dt>

                <dd className="font-medium">@{user.username}</dd>
              </div>

              <div>
                <dt className="text-sm muted-text">Email</dt>

                <dd className="font-medium">{user.email}</dd>
              </div>

              <div>
                <dt className="text-sm muted-text">Email status</dt>

                <dd className="font-medium text-green-700">Verified</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-xl border border-(--border) bg-(--surface) p-6">
            <h3 className="text-lg font-semibold">Getting started</h3>

            <p className="mt-3 muted-text">
              Your future organizations, jobs, candidates and ATS results can be displayed here.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
