import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Access your HirePro account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="auth-card">{children}</div>
    </main>
  );
}
