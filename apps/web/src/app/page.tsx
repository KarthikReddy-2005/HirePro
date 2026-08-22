import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <nav className="page-container flex items-center justify-between py-5">
        <Link href="/" className="text-xl font-bold">
          HirePro
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary">
            Login
          </Link>

          <Link href="/register" className="btn-primary">
            Register
          </Link>
        </div>
      </nav>

      <section className="page-container flex min-h-[70vh] items-center justify-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">HirePro</h1>
      </section>
    </main>
  );
}
