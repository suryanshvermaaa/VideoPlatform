'use client';

import { useEffect, useMemo, useState } from 'react';

type User = { id: string; email: string; name?: string | null; role: 'ADMIN' | 'USER' };

async function getMe(): Promise<User | null> {
  const r = await fetch('/api/auth/me', { cache: 'no-store' });
  if (!r.ok) return null;
  const data = (await r.json()) as { user: User };
  return data.user;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u);
        setReady(true);
        if (!u) window.location.href = '/login';
      })
      .catch(() => {
        setReady(true);
        window.location.href = '/login';
      });
  }, []);

  if (!ready) return <div className="p-6 text-sm text-[hsl(var(--muted-fg))]">Loading…</div>;
  if (!user) return null;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const isAdmin = useMemo(() => user?.role === 'ADMIN', [user]);

  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u);
        setReady(true);
        if (!u) window.location.href = '/login';
      })
      .catch(() => {
        setReady(true);
        window.location.href = '/login';
      });
  }, []);

  if (!ready) return <div className="p-6 text-sm text-[hsl(var(--muted-fg))]">Loading…</div>;
  if (!user) return null;
  if (!isAdmin) return <div className="p-6 text-sm">Forbidden</div>;
  return <>{children}</>;
}
