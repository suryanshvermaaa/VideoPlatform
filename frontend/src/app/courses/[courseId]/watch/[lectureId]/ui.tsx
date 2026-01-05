'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardBody, CardHeader, Skeleton } from '@/components/ui';

type Lecture = { id: string; courseId: string; title: string; description: string; orderIndex: number };

type LectureResponse = {
  lecture: Lecture;
  progress: { progressPct: number; updatedAt: string | null };
};

type Course = { id: string; title: string; description: string; lectures: Array<{ id: string; title: string; description: string; orderIndex: number }> };

type ApiError = { message?: string; code?: string };

type Me = { user: { id: string; email: string } };

type Attachment = { id: string; title: string; mimeType: string; sizeBytes?: number | null; createdAt: string };

export default function WatchClient({ params }: { params: Promise<{ courseId: string; lectureId: string }> }) {
  const [lecture, setLecture] = useState<LectureResponse | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [wmPos, setWmPos] = useState<'tl' | 'tr' | 'bl' | 'br'>('tr');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSentPctRef = useRef<number>(-1);

  const ids = useMemo(() => params, [params]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { courseId, lectureId } = await ids;

      setLoading(true);
      setError(null);

      fetch('/api/auth/me', { cache: 'no-store' })
        .then(async (r) => (r.ok ? ((await r.json()) as Me) : null))
        .then((v) => {
          if (!alive) return;
          setMe(v);
        })
        .catch(() => {
          if (!alive) return;
          setMe(null);
        });

      const [courseRes, lectureRes, streamRes, attRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`, { cache: 'no-store' }),
        fetch(`/api/lectures/${lectureId}`, { cache: 'no-store' }),
        fetch(`/api/lectures/${lectureId}/stream-url`, { cache: 'no-store' }),
        fetch(`/api/attachments/lectures/${lectureId}`, { cache: 'no-store' })
      ]);

      if (!alive) return;

      const errRes = [courseRes, lectureRes, streamRes].find((r) => r.status === 403 || r.status === 401);
      if (errRes && !errRes.ok) {
        const err = (await errRes.json().catch(() => null)) as ApiError | null;
        setError(err ?? { message: 'Access denied' });
      }

      setCourse(courseRes.ok ? ((await courseRes.json()) as { course: Course }).course : null);
      setLecture(lectureRes.ok ? ((await lectureRes.json()) as LectureResponse) : null);
      setStreamUrl(streamRes.ok ? ((await streamRes.json()) as { url: string }).url : null);
      setAttachments(attRes.ok ? (((await attRes.json()) as { attachments: Attachment[] }).attachments) : []);
      setLoading(false);
    })().catch(() => {
      if (!alive) return;
      setCourse(null);
      setLecture(null);
      setStreamUrl(null);
      setAttachments(null);
      setError({ message: 'Failed to load' });
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [ids]);

  async function downloadAttachment(id: string) {
    const r = await fetch(`/api/attachments/${id}/download-url`, { cache: 'no-store' });
    if (!r.ok) throw new Error('Failed to get download URL');
    const data = (await r.json()) as { url: string };
    window.open(data.url, '_blank', 'noopener,noreferrer');
  }

  useEffect(() => {
    const positions: Array<typeof wmPos> = ['tl', 'tr', 'bl', 'br'];
    const t = setInterval(() => {
      setWmPos((p) => {
        const next = positions[(positions.indexOf(p) + 1) % positions.length];
        return next;
      });
    }, 7000);
    return () => clearInterval(t);
  }, []);

  const persistProgress = useCallback(
    async (pct: number) => {
      const { lectureId } = await ids;
      await fetch(`/api/lectures/${lectureId}/progress`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ progressPct: pct })
      });
    },
    [ids]
  );

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onTime = async () => {
      if (!el.duration || !Number.isFinite(el.duration)) return;
      const pct = Math.min(100, Math.max(0, (el.currentTime / el.duration) * 100));
      const rounded = Math.floor(pct);

      // Persist at 5% increments and at the end.
      const shouldSend = rounded === 100 || (rounded % 5 === 0 && rounded !== lastSentPctRef.current);
      if (!shouldSend) return;

      lastSentPctRef.current = rounded;
      await persistProgress(rounded);
    };

    el.addEventListener('timeupdate', onTime);
    return () => el.removeEventListener('timeupdate', onTime);
  }, [lecture, ids, persistProgress]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !lecture?.progress) return;
    if (!el.duration || !Number.isFinite(el.duration)) return;
    if (lecture.progress.progressPct <= 0) return;

    const target = (lecture.progress.progressPct / 100) * el.duration;
    if (Number.isFinite(target) && target > 0) {
      el.currentTime = target;
    }
  }, [lecture]);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </CardHeader>
          <CardBody>
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-11/12" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-1/2" />
          </CardHeader>
          <CardBody>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="mt-2 h-12 w-full" />
            <Skeleton className="mt-2 h-12 w-full" />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error?.code === 'PLAN_INACTIVE' || error?.code === 'PLAN_EXPIRED') {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-sm">
          <div className="font-medium">{error.message ?? 'Plan inactive'}</div>
          <div className="mt-1 text-[hsl(var(--muted-fg))]">Go to your account page to activate/extend your plan.</div>
          <div className="mt-3">
            <Link className="underline" href="/account">
              Open account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!lecture || !course) {
    return <div className="text-sm">Lecture not found or access denied.</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="text-sm text-[hsl(var(--muted-fg))]">
          <Link className="hover:text-[hsl(var(--fg))]" href="/courses">
            Courses
          </Link>
          <span className="px-2">/</span>
          <Link className="hover:text-[hsl(var(--fg))]" href={`/courses/${course.id}`}>
            {course.title}
          </Link>
          <span className="px-2">/</span>
          <span className="text-[hsl(var(--fg))]">{lecture.lecture.title}</span>
        </div>

        <Card>
          <CardBody>
            <div className="relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-black">
            {streamUrl ? (
              <>
                <video
                  ref={videoRef}
                  className="h-full w-full"
                  controls
                  playsInline
                  src={streamUrl}
                  controlsList="nodownload noremoteplayback"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                />
                {me?.user?.email ? (
                  <div
                    className={`pointer-events-none absolute rounded-lg bg-black/40 px-2 py-1 text-xs text-white/70 ${
                      wmPos === 'tr'
                        ? 'right-3 top-3'
                        : wmPos === 'tl'
                          ? 'left-3 top-3'
                          : wmPos === 'bl'
                            ? 'left-3 bottom-3'
                            : 'right-3 bottom-3'
                    }`}
                  >
                    {me.user.email}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex aspect-video items-center justify-center text-sm text-white/70">Loading video…</div>
            )}
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-semibold tracking-tight">{lecture.lecture.title}</h1>
            <div className="prose prose-sm mt-2 max-w-none text-[hsl(var(--muted-fg))] dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{lecture.lecture.description}</ReactMarkdown>
            </div>
          </div>
          </CardBody>
        </Card>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Lectures</div>
              <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">Course: {course.title}</div>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {course.lectures.map((l) => {
                  const active = l.id === lecture.lecture.id;
                  return (
                    <Link
                      key={l.id}
                      href={`/courses/${course.id}/watch/${l.id}`}
                      className={`block rounded-xl border p-3 text-sm transition hover:bg-[hsl(var(--muted))] ${
                        active ? 'border-[hsl(var(--fg))]' : 'border-[hsl(var(--border))]'
                      }`}
                    >
                      <div className="font-medium">{l.title}</div>
                      <div className="mt-1 line-clamp-2 text-[hsl(var(--muted-fg))]">{l.description}</div>
                    </Link>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-sm font-semibold">Resources</div>
              <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">Attachments for this lecture.</div>
            </CardHeader>
            <CardBody>
              {attachments === null ? (
                <Skeleton className="h-10 w-full" />
              ) : attachments.length === 0 ? (
                <div className="text-sm text-[hsl(var(--muted-fg))]">No attachments for this lecture.</div>
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
        </div>
      </div>
    </div>
  );
}
