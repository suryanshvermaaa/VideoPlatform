'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui';

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

export default function AccountClient() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (r) => (r.ok ? ((await r.json()) as Me) : null))
      .then((v) => setMe(v))
      .catch(() => setMe(null));
  }, []);

  const planText = useMemo(() => {
    if (!me?.user) return null;
    const until = me.user.planActiveUntil ? new Date(me.user.planActiveUntil) : null;
    const expired = until ? until.getTime() < Date.now() : false;
    const untilStr = until ? until.toLocaleDateString() : 'No expiry';

    if (me.user.role === 'ADMIN') return `Admin account (plan not enforced)`;
    if (me.user.planStatus !== 'ACTIVE') return `Plan: INACTIVE`;
    if (expired) return `Plan: EXPIRED (until ${untilStr})`;
    return `Plan: ACTIVE (until ${untilStr})`;
  }, [me]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Account</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="font-semibold">Plan status</div>
        </CardHeader>
        <CardBody>
          <div className="text-sm text-[hsl(var(--muted-fg))]">{planText ?? 'Not signed in.'}</div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="font-semibold">Payments</div>
        </CardHeader>
        <CardBody>
          <div className="text-sm text-[hsl(var(--muted-fg))]">Course purchases are done from the course page.</div>
          <div className="mt-3">
            <Link className="underline" href="/courses">
              Browse courses
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
