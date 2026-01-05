'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PublicShell } from '@/components/app/public-shell';
import { Button, Card, CardBody, CardHeader, Input } from '@/components/ui';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim() ? name.trim() : undefined, email, password })
      });

      if (!r.ok) {
        const data = (await r.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? 'Signup failed');
      }

      window.location.href = '/courses';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <div className="mx-auto grid w-full max-w-md gap-6 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-fg))]">Sign up to purchase and access courses.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">Create account</div>
            <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">Takes less than a minute.</div>
          </CardHeader>
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">Name (optional)</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
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
                {loading ? 'Creating…' : 'Create account'}
              </Button>
              <div className="text-sm text-[hsl(var(--muted-fg))]">
                Already have an account?{' '}
                <Link className="underline" href="/login">
                  Sign in
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </PublicShell>
  );
}
