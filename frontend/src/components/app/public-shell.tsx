'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui';

type Me = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: 'ADMIN' | 'USER';
  };
};

export function PublicShell({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (r) => (r.ok ? ((await r.json()) as Me) : null))
      .then((v) => setMe(v))
      .catch(() => setMe(null));
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-semibold">
              VideoPlatform
            </Link>
            <nav className="hidden items-center gap-3 text-sm text-[hsl(var(--muted-fg))] sm:flex">
              <Link className="hover:text-[hsl(var(--fg))]" href="/courses">
                Courses
              </Link>
              <Link className="hover:text-[hsl(var(--fg))]" href="/account">
                Account
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {me?.user ? (
              <Link href="/courses">
                <Button>Open app</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link href="/signup">
                  <Button>Create account</Button>
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>

      <footer className="border-t border-[hsl(var(--border))]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-[hsl(var(--muted-fg))] sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} VideoPlatform</div>
          <div className="flex items-center gap-4">
            <Link className="hover:text-[hsl(var(--fg))]" href="/login">
              Login
            </Link>
            <Link className="hover:text-[hsl(var(--fg))]" href="/signup">
              Signup
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
