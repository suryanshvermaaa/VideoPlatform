'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardBody, CardHeader, Input, Skeleton } from '@/components/ui';

type User = { id: string; email: string; name?: string | null; role: 'ADMIN' | 'USER'; createdAt: string };

type UserWithPlan = User & { planStatus: 'ACTIVE' | 'INACTIVE'; planActiveUntil?: string | null };

export default function UsersClient() {
  const [users, setUsers] = useState<UserWithPlan[] | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'USER'>('USER');
  const [planStatus, setPlanStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [planActiveUntil, setPlanActiveUntil] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sorted = useMemo(() => (users ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [users]);

  async function load() {
    const r = await fetch('/api/admin/users', { cache: 'no-store' });
    const data = (await r.json()) as { users: UserWithPlan[] };
    setUsers(data.users);
  }

  useEffect(() => {
    load().catch(() => setUsers([]));
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          password,
          role,
          planStatus,
          planActiveUntil: planActiveUntil ? planActiveUntil : null
        })
      });
      if (!r.ok) {
        const t = (await r.json().catch(() => null)) as { message?: string } | null;
        throw new Error(t?.message ?? 'Failed to create user');
      }
      setEmail('');
      setName('');
      setPassword('');
      setRole('USER');
      setPlanStatus('ACTIVE');
      setPlanActiveUntil('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function updateUser(
    id: string,
    patch: Partial<{ name: string; role: 'ADMIN' | 'USER'; password: string; planStatus: 'ACTIVE' | 'INACTIVE'; planActiveUntil: string | null }>
  ) {
    const r = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch)
    });
    if (!r.ok) throw new Error('Update failed');
    await load();
  }

  async function deleteUser(id: string) {
    const r = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error('Delete failed');
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="font-semibold">Create user</div>
          <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">Admin can create accounts (users can also self-signup).</div>
        </CardHeader>
        <CardBody>
          <form onSubmit={createUser} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <label className="mb-1 block text-sm">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="sm:col-span-1">
              <label className="mb-1 block text-sm">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="sm:col-span-1">
              <label className="mb-1 block text-sm">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="sm:col-span-1">
              <label className="mb-1 block text-sm">Role</label>
              <select
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as 'ADMIN' | 'USER')}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="sm:col-span-1">
              <label className="mb-1 block text-sm">Plan status</label>
              <select
                className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                value={planStatus}
                onChange={(e) => setPlanStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div className="sm:col-span-1">
              <label className="mb-1 block text-sm">Plan active until</label>
              <Input type="date" value={planActiveUntil} onChange={(e) => setPlanActiveUntil(e.target.value)} />
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPlanActiveUntil(addMonthsToDateInput(planActiveUntil || todayDateInput(), 1))}
                >
                  +1 month
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPlanActiveUntil(addMonthsToDateInput(planActiveUntil || todayDateInput(), 12))}
                >
                  +1 year
                </Button>
                <Button type="button" variant="ghost" onClick={() => setPlanActiveUntil('')}>
                  Clear
                </Button>
              </div>
            </div>
            {error ? <div className="sm:col-span-2 text-sm text-red-600">{error}</div> : null}
            <div className="sm:col-span-2">
              <Button disabled={busy} className="w-full sm:w-auto">
                {busy ? 'Creating…' : 'Create user'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="font-semibold">All users</div>
        </CardHeader>
        <CardBody>
          {users === null ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-sm text-[hsl(var(--muted-fg))]">No users yet.</div>
          ) : (
            <div className="space-y-2">
              {sorted.map((u) => (
                <UserRow key={u.id} user={u} onUpdate={updateUser} onDelete={deleteUser} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function UserRow({
  user,
  onUpdate,
  onDelete
}: {
  user: UserWithPlan;
  onUpdate: (
    id: string,
    patch: Partial<{ name: string; role: 'ADMIN' | 'USER'; password: string; planStatus: 'ACTIVE' | 'INACTIVE'; planActiveUntil: string | null }>
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(user.name ?? '');
  const [role, setRole] = useState<'ADMIN' | 'USER'>(user.role);
  const [password, setPassword] = useState('');
  const [planStatus, setPlanStatus] = useState<'ACTIVE' | 'INACTIVE'>(user.planStatus);
  const [planActiveUntil, setPlanActiveUntil] = useState<string>(
    user.planActiveUntil ? new Date(user.planActiveUntil).toISOString().slice(0, 10) : ''
  );
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const patch: Partial<{
      name: string;
      role: 'ADMIN' | 'USER';
      password: string;
      planStatus: 'ACTIVE' | 'INACTIVE';
      planActiveUntil: string | null;
    }> = {};
    if ((user.name ?? '') !== name) patch.name = name || '';
    if (user.role !== role) patch.role = role;
    if (password) patch.password = password;
    if (user.planStatus !== planStatus) patch.planStatus = planStatus;
    {
      const current = user.planActiveUntil ? new Date(user.planActiveUntil).toISOString().slice(0, 10) : '';
      if (current !== planActiveUntil) patch.planActiveUntil = planActiveUntil ? planActiveUntil : null;
    }
    try {
      await onUpdate(user.id, patch);
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm(`Delete user ${user.email}?`)) return;
    setBusy(true);
    try {
      await onDelete(user.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium">{user.email}</div>
          <div className="text-xs text-[hsl(var(--muted-fg))]">{user.id}</div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input className="sm:w-48" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <select
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm sm:w-32"
            value={role}
            onChange={(e) => setRole(e.target.value as 'ADMIN' | 'USER')}
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <select
            className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm sm:w-32"
            value={planStatus}
            onChange={(e) => setPlanStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <Input
            className="sm:w-40"
            type="date"
            value={planActiveUntil}
            onChange={(e) => setPlanActiveUntil(e.target.value)}
          />
          <Input
            className="sm:w-48"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
          />
          <Button disabled={busy} onClick={save}>
            Save
          </Button>
          <Button disabled={busy} variant="ghost" onClick={del}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsToDateInput(yyyyMmDd: string, months: number) {
  const d = new Date(`${yyyyMmDd}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}
