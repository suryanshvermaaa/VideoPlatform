'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button, Card, CardBody, CardHeader, Input, Skeleton } from '@/components/ui';

type Lecture = { id: string; title: string; description: string; orderIndex: number };
type Course = { id: string; title: string; description: string; lectures?: Lecture[]; priceInrPaise: number };
type ApiError = { message?: string; code?: string; issues?: Array<{ path: Array<string | number>; message: string }> };

type Attachment = { id: string; title: string; mimeType: string; sizeBytes?: number | null; createdAt: string };

declare global {
  interface Window {
    Cashfree?: (opts: { mode: 'sandbox' | 'production' }) => {
      checkout: (opts: { paymentSessionId: string; redirectTarget?: string }) => void;
    };
  }
}

export default function CourseClient({ params }: { params: Promise<{ courseId: string }> }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [assigned, setAssigned] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<Attachment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [phone, setPhone] = useState('');
  const [coupon, setCoupon] = useState('');
  const [buyBusy, setBuyBusy] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buyDone, setBuyDone] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    params.then(({ courseId }) => {
      fetch(`/api/courses/${courseId}`, { cache: 'no-store' })
        .then(async (r) => {
          if (r.ok) return (await r.json()) as { course: Course; assigned?: boolean };
          const err = (await r.json().catch(() => null)) as ApiError | null;
          setError(err);
          return null;
        })
        .then((d) => {
          if (!alive) return;
          setCourse(d?.course ?? null);
          setAssigned(Boolean(d?.assigned));
          setAttachments(null);

          if (d?.assigned) {
            fetch(`/api/attachments/courses/${courseId}`, { cache: 'no-store' })
              .then(async (r) => (r.ok ? (((await r.json()) as { attachments: Attachment[] }).attachments) : []))
              .then((atts) => {
                if (!alive) return;
                setAttachments(atts);
              })
              .catch(() => {
                if (!alive) return;
                setAttachments([]);
              });
          }

          setLoading(false);
        })
        .catch(() => {
          if (!alive) return;
          setCourse(null);
          setError({ message: 'Failed to load' });
          setLoading(false);
        });
    });
    return () => {
      alive = false;
    };
  }, [params]);

  async function downloadAttachment(id: string) {
    const r = await fetch(`/api/attachments/${id}/download-url`, { cache: 'no-store' });
    if (!r.ok) throw new Error('Failed to get download URL');
    const data = (await r.json()) as { url: string };
    window.open(data.url, '_blank', 'noopener,noreferrer');
  }

  async function buyCourse() {
    if (!course) return;
    setBuyError(null);
    setBuyDone(null);
    setBuyBusy(true);
    try {
      if (!phone.trim()) throw new Error('Phone is required');

      const r = await fetch('/api/payments/cashfree/create-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          phone,
          couponCode: coupon.trim() ? coupon.trim().toUpperCase() : undefined
        })
      });

      const data = (await r.json().catch(() => null)) as
        | { assigned: true; free: true }
        | { cashfree: { paymentSessionId: string; mode: 'sandbox' | 'production' }; payment: { providerOrderId: string } }
        | { message?: string; issues?: Array<{ path: Array<string | number>; message: string }> };

      if (!r.ok) {
        const issues = (data as any)?.issues as Array<{ path: Array<string | number>; message: string }> | undefined;
        if (issues && issues.length) {
          const msg = issues
            .map((i) => `${i.path?.length ? i.path.join('.') : 'body'}: ${i.message}`)
            .join(' | ');
          throw new Error(msg);
        }
        throw new Error((data as any)?.message ?? 'Failed to start payment');
      }

      if ((data as any).assigned && (data as any).free) {
        setAssigned(true);
        setBuyDone('Access granted (free after coupon).');
        return;
      }

      const paymentSessionId = (data as any)?.cashfree?.paymentSessionId as string | undefined;
      const mode = (data as any)?.cashfree?.mode as 'sandbox' | 'production' | undefined;
      if (!paymentSessionId) throw new Error('Missing Cashfree payment session id');
      if (!sdkReady || !window.Cashfree) throw new Error('Cashfree SDK not loaded');

      const cashfree = window.Cashfree({ mode: mode ?? 'sandbox' });
      cashfree.checkout({ paymentSessionId, redirectTarget: '_self' });
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setBuyBusy(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="mt-2 h-4 w-4/5" />
        </CardHeader>
        <CardBody>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-11/12" />
        </CardBody>
      </Card>
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

  if (!course) return <div className="text-sm">Course not found.</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" onLoad={() => setSdkReady(true)} />

      <div className="space-y-4">
        <div className="text-sm text-[hsl(var(--muted-fg))]">
          <Link className="hover:text-[hsl(var(--fg))]" href="/courses">
            Courses
          </Link>
          <span className="px-2">/</span>
          <span className="text-[hsl(var(--fg))]">{course.title}</span>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
              {assigned ? (
                <span className="h-fit rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2 py-0.5 text-xs">
                  Unlocked
                </span>
              ) : (
                <span className="h-fit rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 py-0.5 text-xs">
                  Locked
                </span>
              )}
            </div>
            <div className="prose prose-sm mt-3 max-w-none text-[hsl(var(--muted-fg))] dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{course.description}</ReactMarkdown>
            </div>
          </CardHeader>
          <CardBody>
            {assigned ? (
              <div className="text-sm text-[hsl(var(--muted-fg))]">Pick a lecture from the right to start watching.</div>
            ) : (
              <div className="text-sm text-[hsl(var(--muted-fg))]">Buy access to unlock all lectures in this course.</div>
            )}
          </CardBody>
        </Card>
      </div>

      {assigned ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Attachments</div>
              <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">Assignments and resources for this course.</div>
            </CardHeader>
            <CardBody>
              {attachments === null ? (
                <Skeleton className="h-10 w-full" />
              ) : attachments.length === 0 ? (
                <div className="text-sm text-[hsl(var(--muted-fg))]">No attachments yet.</div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => downloadAttachment(a.id).catch(() => null)}
                      className="w-full rounded-xl border border-[hsl(var(--border))] p-3 text-left text-sm transition hover:bg-[hsl(var(--muted))]"
                    >
                      <div className="font-medium">{a.title}</div>
                      <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                        {a.mimeType}
                        {a.sizeBytes ? ` • ${Math.round(a.sizeBytes / 1024)} KB` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Lectures</div>
              <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">Choose where to start.</div>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {(course.lectures ?? []).map((l) => (
                  <Link
                    key={l.id}
                    href={`/courses/${course.id}/watch/${l.id}`}
                    className="block rounded-xl border border-[hsl(var(--border))] p-3 text-sm transition hover:bg-[hsl(var(--muted))]"
                  >
                    <div className="font-medium">{l.title}</div>
                    <div className="mt-1 line-clamp-2 text-[hsl(var(--muted-fg))]">{l.description}</div>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">Buy access</div>
            <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">Pay ₹{(course.priceInrPaise / 100).toFixed(2)} via Cashfree.</div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9999999999" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Coupon (optional)</label>
                <Input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="SAVE10" />
              </div>

              {buyError ? <div className="text-sm text-red-600">{buyError}</div> : null}
              {buyDone ? <div className="text-sm">{buyDone}</div> : null}

              <Button disabled={buyBusy || !sdkReady} onClick={buyCourse} className="w-full">
                {buyBusy ? 'Starting…' : 'Pay with Cashfree'}
              </Button>

              <div className="text-xs text-[hsl(var(--muted-fg))]">Access is granted after Cashfree webhook confirms payment.</div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
