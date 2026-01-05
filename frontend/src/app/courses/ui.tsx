'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Skeleton } from '@/components/ui';

type Course = { id: string; title: string; description: string; thumbnailKey?: string | null; priceInrPaise: number; assigned: boolean };

type ApiError = { message?: string; code?: string };

export default function CoursesClient() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    fetch('/api/courses', { cache: 'no-store' })
      .then(async (r) => {
        if (r.ok) return { courses: ((await r.json()) as { courses: Course[] }).courses };
        const err = (await r.json().catch(() => null)) as ApiError | null;
        setError(err);
        return { courses: [] };
      })
      .then((d) => setCourses(d.courses))
      .catch(() => {
        setError({ message: 'Failed to load' });
        setCourses([]);
      });
  }, []);

  if (courses === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-2 h-4 w-4/5" />
            </CardHeader>
            <CardBody>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-11/12" />
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  if (error?.code === 'PLAN_INACTIVE' || error?.code === 'PLAN_EXPIRED') {
    return (
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-sm">
        <div className="font-medium">{error.message ?? 'Plan inactive'}</div>
        <div className="mt-1 text-[hsl(var(--muted-fg))]">Go to Account to activate your plan.</div>
        <div className="mt-3">
          <Link className="underline" href="/account">
            Open account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">Browse, buy, and continue where you left off.</div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-sm text-[hsl(var(--muted-fg))]">
          No courses found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <Link key={c.id} href={`/courses/${c.id}`} className="group block">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-base font-semibold">{c.title}</div>
                    {c.assigned ? (
                      <span className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2 py-0.5 text-xs">Assigned</span>
                    ) : (
                      <span className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-0.5 text-xs">Locked</span>
                    )}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm text-[hsl(var(--muted-fg))]">{c.description}</div>
                </CardHeader>
                <CardBody>
                  <div className="flex items-center justify-between gap-3">
                    {c.assigned ? (
                      <div className="text-sm text-[hsl(var(--muted-fg))]">Open course</div>
                    ) : (
                      <div className="text-sm text-[hsl(var(--muted-fg))]">Buy for ₹{(c.priceInrPaise / 100).toFixed(2)}</div>
                    )}
                    <div className="text-sm font-medium opacity-0 transition group-hover:opacity-100">→</div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
