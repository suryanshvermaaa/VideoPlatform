'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PublicShell } from '@/components/app/public-shell';
import { Button, Card, CardBody, CardHeader, Input } from '@/components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!r.ok) {
        const data = (await r.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? 'Login failed');
      }

      window.location.href = '/courses';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <div className="mx-auto grid w-full max-w-md gap-6 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-fg))]">Sign in to access your courses.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">Sign in</div>
            <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">Use your email and password.</div>
          </CardHeader>
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {error ? <div className="text-sm text-red-600">{error}</div> : null}
              <Button disabled={loading} className="w-full">
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
              <div className="text-sm text-[hsl(var(--muted-fg))]">
                New here?{' '}
                <Link className="underline" href="/signup">
                  Create an account
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </PublicShell>
  );
}
