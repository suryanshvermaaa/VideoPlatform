'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

type Me = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: 'ADMIN' | 'USER';
    planStatus: 'ACTIVE' | 'INACTIVE';
    planActiveUntil?: string | null;
  };
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (r) => (r.ok ? ((await r.json()) as Me) : null))
      .then((v) => setMe(v))
      .catch(() => setMe(null));
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/courses" className="font-semibold">
              VideoPlatform
            </Link>
            <nav className="hidden items-center gap-3 text-sm text-[hsl(var(--muted-fg))] sm:flex">
              <Link className="hover:text-[hsl(var(--fg))]" href="/courses">
                Courses
              </Link>
              <Link className="hover:text-[hsl(var(--fg))]" href="/account">
                Account
              </Link>
              {me?.user?.role === 'ADMIN' ? (
                <Link className="hover:text-[hsl(var(--fg))]" href="/admin">
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {me?.user ? (
              <button
                type="button"
                onClick={logout}
                className="text-sm text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--fg))]"
              >
                Logout
              </button>
            ) : (
              <Link className="text-sm underline" href="/login">
                Login
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
