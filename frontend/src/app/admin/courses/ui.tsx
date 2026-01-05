'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button, Card, CardBody, CardHeader, Input, Skeleton, Textarea } from '@/components/ui';

type Course = { id: string; title: string; description: string; thumbnailKey?: string | null; createdAt: string };

type CourseDetail = Course & { lectures: Array<{ id: string; title: string; description: string; orderIndex: number }> };

type User = { id: string; email: string; name?: string | null; role: 'ADMIN' | 'USER' };

type Assignment = { id: string; user: User; course: { id: string; title: string } };

type Attachment = {
  id: string;
  title: string;
  mimeType: string;
  sizeBytes?: number | null;
  lectureId?: string | null;
  createdAt: string;
};

type StorageProvider = {
  id: string;
  name: string;
  endpoint?: string | null;
  region: string;
  bucket: string;
  accessKeyId: string;
  forcePathStyle: boolean;
  active: boolean;
  isDefault: boolean;
};

export default function CoursesAdminClient() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CourseDetail | null>(null);

  const [users, setUsers] = useState<User[] | null>(null);
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);

  const [providers, setProviders] = useState<StorageProvider[] | null>(null);
  const [providerId, setProviderId] = useState<string>('');

  const [provName, setProvName] = useState('');
  const [provEndpoint, setProvEndpoint] = useState('');
  const [provRegion, setProvRegion] = useState('us-east-1');
  const [provBucket, setProvBucket] = useState('');
  const [provAccessKeyId, setProvAccessKeyId] = useState('');
  const [provSecretAccessKey, setProvSecretAccessKey] = useState('');
  const [provForcePathStyle, setProvForcePathStyle] = useState(false);
  const [provActive, setProvActive] = useState(true);
  const [provDefault, setProvDefault] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureDesc, setLectureDesc] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [notesLectureId, setNotesLectureId] = useState('');
  const [notesMd, setNotesMd] = useState('');

  const [courseAttachments, setCourseAttachments] = useState<Attachment[] | null>(null);
  const [lectureAttachments, setLectureAttachments] = useState<Attachment[] | null>(null);
  const [attTitle, setAttTitle] = useState('');
  const [attFile, setAttFile] = useState<File | null>(null);
  const [attLectureId, setAttLectureId] = useState<string>('');
  const [attLectureTitle, setAttLectureTitle] = useState('');
  const [attLectureFile, setAttLectureFile] = useState<File | null>(null);

  const [assignUserId, setAssignUserId] = useState<string>('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedCourses = useMemo(() => (courses ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [courses]);

  async function loadCourses() {
    const r = await fetch('/api/admin/courses', { cache: 'no-store' });
    const data = (await r.json()) as { courses: Course[] };
    setCourses(data.courses);
  }

  async function loadUsers() {
    const r = await fetch('/api/admin/users', { cache: 'no-store' });
    const data = (await r.json()) as { users: User[] };
    setUsers(data.users);
  }

  async function loadAssignments() {
    const r = await fetch('/api/admin/assignments', { cache: 'no-store' });
    const data = (await r.json()) as { assignments: Assignment[] };
    setAssignments(data.assignments);
  }

  async function loadProviders() {
    const r = await fetch('/api/admin/storage-providers', { cache: 'no-store' });
    const data = (await r.json()) as { providers: StorageProvider[] };
    setProviders(data.providers);

    // If none selected, prefer default provider.
    if (!providerId) {
      const def = data.providers.find((p) => p.isDefault && p.active);
      if (def) setProviderId(def.id);
    }
  }

  async function loadCourse(courseId: string) {
    const r = await fetch(`/api/admin/courses/${courseId}`, { cache: 'no-store' });
    const data = (await r.json()) as { course: CourseDetail };
    setDetail(data.course);
  }

  async function loadCourseAttachments(courseId: string) {
    const r = await fetch(`/api/admin/attachments/courses/${courseId}`, { cache: 'no-store' });
    const data = (await r.json()) as { attachments: Attachment[] };
    setCourseAttachments(data.attachments);
  }

  async function loadLectureAttachments(lectureId: string) {
    const r = await fetch(`/api/admin/attachments/lectures/${lectureId}`, { cache: 'no-store' });
    const data = (await r.json()) as { attachments: Attachment[] };
    setLectureAttachments(data.attachments);
  }

  useEffect(() => {
    loadCourses().catch(() => setCourses([]));
    loadUsers().catch(() => setUsers([]));
    loadAssignments().catch(() => setAssignments([]));
    loadProviders().catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setCourseAttachments(null);
      setLectureAttachments(null);
      setAttLectureId('');
      setNotesLectureId('');
      setNotesMd('');
      return;
    }
    loadCourse(selectedId).catch(() => setDetail(null));
    loadCourseAttachments(selectedId).catch(() => setCourseAttachments([]));
  }, [selectedId]);

  useEffect(() => {
    if (!attLectureId) {
      setLectureAttachments(null);
      return;
    }
    loadLectureAttachments(attLectureId).catch(() => setLectureAttachments([]));
  }, [attLectureId]);

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      if (!r.ok) throw new Error('Failed to create course');
      setTitle('');
      setDescription('');
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function assignUser(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !assignUserId) return;
    setBusy(true);
    try {
      const r = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: assignUserId, courseId: selectedId })
      });
      if (!r.ok) throw new Error('Failed to assign');
      await loadAssignments();
    } finally {
      setBusy(false);
    }
  }

  async function createLecture(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    if (!videoFile) {
      setError('Select a video file');
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const key = `videos/${selectedId}/${Date.now()}_${videoFile.name}`;

      const presign = await fetch('/api/admin/r2/presign-upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key, contentType: videoFile.type || 'video/mp4', providerId: providerId || null })
      });
      if (!presign.ok) throw new Error('Failed to get upload URL');
      const { url } = (await presign.json()) as { url: string };

      const put = await fetch(url, {
        method: 'PUT',
        headers: { 'content-type': videoFile.type || 'video/mp4' },
        body: videoFile
      });
      if (!put.ok) {
        const t = await put.text().catch(() => '');
        throw new Error(`Upload failed (${put.status})${t ? `: ${t.slice(0, 300)}` : ''}`);
      }

      const r = await fetch(`/api/admin/courses/${selectedId}/lectures`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: lectureTitle,
          description: lectureDesc,
          orderIndex,
          videoKey: key,
          storageProviderId: providerId || null
        })
      });
      if (!r.ok) throw new Error('Failed to create lecture');

      setLectureTitle('');
      setLectureDesc('');
      setOrderIndex(0);
      setVideoFile(null);

      await loadCourse(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function createProvider(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const r = await fetch('/api/admin/storage-providers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: provName,
          endpoint: provEndpoint.trim() ? provEndpoint.trim() : null,
          region: provRegion,
          bucket: provBucket,
          accessKeyId: provAccessKeyId,
          secretAccessKey: provSecretAccessKey,
          forcePathStyle: provForcePathStyle,
          active: provActive,
          isDefault: provDefault
        })
      });
      if (!r.ok) {
        const t = (await r.json().catch(() => null)) as { message?: string } | null;
        throw new Error(t?.message ?? 'Failed to create provider');
      }

      setProvName('');
      setProvEndpoint('');
      setProvRegion('us-east-1');
      setProvBucket('');
      setProvAccessKeyId('');
      setProvSecretAccessKey('');
      setProvForcePathStyle(false);
      setProvActive(true);
      setProvDefault(false);

      await loadProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function deleteProvider(id: string) {
    if (!confirm('Delete this storage provider?')) return;
    setError(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/storage-providers/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Failed to delete provider');
      if (providerId === id) setProviderId('');
      await loadProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function uploadCourseAttachment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    if (!attFile) {
      setError('Select a file');
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const key = `attachments/${selectedId}/${Date.now()}_${attFile.name}`;

      const presign = await fetch('/api/admin/r2/presign-upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key, contentType: attFile.type || 'application/octet-stream', providerId: providerId || null })
      });
      if (!presign.ok) throw new Error('Failed to get upload URL');
      const { url } = (await presign.json()) as { url: string };

      const put = await fetch(url, {
        method: 'PUT',
        headers: { 'content-type': attFile.type || 'application/octet-stream' },
        body: attFile
      });
      if (!put.ok) {
        const t = await put.text().catch(() => '');
        throw new Error(`Upload failed (${put.status})${t ? `: ${t.slice(0, 300)}` : ''}`);
      }

      const r = await fetch(`/api/admin/attachments/courses/${selectedId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: attTitle.trim() || attFile.name,
          fileKey: key,
          mimeType: attFile.type || 'application/octet-stream',
          sizeBytes: attFile.size,
          storageProviderId: providerId || null
        })
      });
      if (!r.ok) throw new Error('Failed to create attachment');

      setAttTitle('');
      setAttFile(null);
      await loadCourseAttachments(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function uploadLectureAttachment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    if (!attLectureId) {
      setError('Select a lecture');
      return;
    }
    if (!attLectureFile) {
      setError('Select a file');
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const key = `attachments/${selectedId}/${attLectureId}/${Date.now()}_${attLectureFile.name}`;

      const presign = await fetch('/api/admin/r2/presign-upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key, contentType: attLectureFile.type || 'application/octet-stream', providerId: providerId || null })
      });
      if (!presign.ok) throw new Error('Failed to get upload URL');
      const { url } = (await presign.json()) as { url: string };

      const put = await fetch(url, {
        method: 'PUT',
        headers: { 'content-type': attLectureFile.type || 'application/octet-stream' },
        body: attLectureFile
      });
      if (!put.ok) {
        const t = await put.text().catch(() => '');
        throw new Error(`Upload failed (${put.status})${t ? `: ${t.slice(0, 300)}` : ''}`);
      }

      const r = await fetch(`/api/admin/attachments/lectures/${attLectureId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: attLectureTitle.trim() || attLectureFile.name,
          fileKey: key,
          mimeType: attLectureFile.type || 'application/octet-stream',
          sizeBytes: attLectureFile.size,
          storageProviderId: providerId || null
        })
      });
      if (!r.ok) throw new Error('Failed to create attachment');

      setAttLectureTitle('');
      setAttLectureFile(null);
      await loadLectureAttachments(attLectureId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function deleteAttachment(id: string) {
    if (!confirm('Delete this attachment record?')) return;
    setError(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/attachments/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Failed to delete attachment');
      if (selectedId) await loadCourseAttachments(selectedId);
      if (attLectureId) await loadLectureAttachments(attLectureId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function saveLectureNotes(e: React.FormEvent) {
    e.preventDefault();
    if (!notesLectureId) return;

    setError(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/lectures/${notesLectureId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notesMd: notesMd.trim() ? notesMd : null })
      });
      if (!r.ok) throw new Error('Failed to save notes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="font-semibold">Storage providers</div>
            <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">Add multiple S3-compatible accounts and pick one per upload.</div>
          </CardHeader>
          <CardBody>
            {providers === null ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : providers.length === 0 ? (
              <div className="text-sm text-[hsl(var(--muted-fg))]">No providers added. Uploads will use env-configured storage.</div>
            ) : (
              <div className="space-y-2">
                {providers.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-[hsl(var(--border))] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                          {p.bucket} • {p.region} {p.endpoint ? `• ${p.endpoint}` : ''}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-[hsl(var(--muted-fg))]">
                          {p.isDefault ? <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5">Default</span> : null}
                          {p.active ? <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5">Active</span> : <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5">Inactive</span>}
                        </div>
                      </div>
                      <Button disabled={busy} variant="ghost" onClick={() => deleteProvider(p.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <div className="text-sm font-semibold">Add provider</div>
              <form onSubmit={createProvider} className="mt-2 grid gap-3">
                <div>
                  <label className="mb-1 block text-sm">Name</label>
                  <Input value={provName} onChange={(e) => setProvName(e.target.value)} placeholder="minio-2 / r2-2 / s3-free" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Endpoint (optional)</label>
                  <Input value={provEndpoint} onChange={(e) => setProvEndpoint(e.target.value)} placeholder="https://... or http://localhost:9000" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm">Region</label>
                    <Input value={provRegion} onChange={(e) => setProvRegion(e.target.value)} placeholder="us-east-1" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Bucket</label>
                    <Input value={provBucket} onChange={(e) => setProvBucket(e.target.value)} placeholder="videoplatform" required />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm">Access key ID</label>
                  <Input value={provAccessKeyId} onChange={(e) => setProvAccessKeyId(e.target.value)} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Secret access key</label>
                  <Input type="password" value={provSecretAccessKey} onChange={(e) => setProvSecretAccessKey(e.target.value)} required />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={provForcePathStyle} onChange={(e) => setProvForcePathStyle(e.target.checked)} />
                  Force path style (MinIO)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={provActive} onChange={(e) => setProvActive(e.target.checked)} />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={provDefault} onChange={(e) => setProvDefault(e.target.checked)} />
                  Set as default
                </label>

                <Button disabled={busy} className="w-full">
                  {busy ? 'Saving…' : 'Add provider'}
                </Button>
              </form>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="font-semibold">Create course</div>
            <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">Markdown supported in description.</div>
          </CardHeader>
          <CardBody>
            <form onSubmit={createCourse} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-sm">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
              </div>
              {error ? <div className="text-sm text-red-600">{error}</div> : null}
              <Button disabled={busy} className="w-full">
                {busy ? 'Saving…' : 'Create course'}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="font-semibold">Courses</div>
          </CardHeader>
          <CardBody>
            {courses === null ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : sortedCourses.length === 0 ? (
              <div className="text-sm text-[hsl(var(--muted-fg))]">No courses yet.</div>
            ) : (
              <div className="space-y-2">
                {sortedCourses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full rounded-xl border p-3 text-left text-sm transition hover:bg-[hsl(var(--muted))] ${
                      selectedId === c.id ? 'border-[hsl(var(--fg))]' : 'border-[hsl(var(--border))]'
                    }`}
                  >
                    <div className="font-medium">{c.title}</div>
                    <div className="mt-1 line-clamp-2 text-[hsl(var(--muted-fg))]">{c.description}</div>
                  </button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="space-y-4">
        {!detail ? (
          <Card>
            <CardBody>
              <div className="text-sm text-[hsl(var(--muted-fg))]">Select a course to manage lectures and assignments.</div>
            </CardBody>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="font-semibold">{detail.title}</div>
                <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">Course description preview</div>
              </CardHeader>
              <CardBody>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{detail.description}</ReactMarkdown>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="font-semibold">Assign users</div>
              </CardHeader>
              <CardBody>
                <form onSubmit={assignUser} className="flex flex-col gap-2 sm:flex-row">
                  <select
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                  >
                    <option value="">Select user…</option>
                    {(users ?? []).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email} ({u.role})
                      </option>
                    ))}
                  </select>
                  <Button disabled={busy || !assignUserId}>
                    Assign
                  </Button>
                </form>
                <div className="mt-3 text-sm text-[hsl(var(--muted-fg))]">Current assignments for this course:</div>
                <div className="mt-2 space-y-1">
                  {(assignments ?? [])
                    .filter((a) => a.course.id === detail.id)
                    .map((a) => (
                      <div key={a.id} className="rounded-xl border border-[hsl(var(--border))] px-3 py-2 text-sm">
                        {a.user.email}
                      </div>
                    ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="font-semibold">Add lecture</div>
                <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">Uploads directly to S3-compatible storage (no transcoding).</div>
              </CardHeader>
              <CardBody>
                <form onSubmit={createLecture} className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm">Storage provider</label>
                    <select
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                      value={providerId}
                      onChange={(e) => setProviderId(e.target.value)}
                    >
                      <option value="">Default (env / default provider)</option>
                      {(providers ?? [])
                        .filter((p) => p.active)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}{p.isDefault ? ' (default)' : ''}
                          </option>
                        ))}
                    </select>
                    <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">The lecture will remember this provider for streaming.</div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm">Title</label>
                    <Input value={lectureTitle} onChange={(e) => setLectureTitle(e.target.value)} required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm">Description</label>
                    <Textarea value={lectureDesc} onChange={(e) => setLectureDesc(e.target.value)} rows={3} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Order</label>
                    <Input type="number" value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Video file</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  {error ? <div className="sm:col-span-2 text-sm text-red-600">{error}</div> : null}
                  <div className="sm:col-span-2">
                    <Button disabled={busy} className="w-full sm:w-auto">
                      {busy ? 'Uploading…' : 'Create lecture'}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="font-semibold">Lectures</div>
              </CardHeader>
              <CardBody>
                {detail.lectures.length === 0 ? (
                  <div className="text-sm text-[hsl(var(--muted-fg))]">No lectures yet.</div>
                ) : (
                  <div className="space-y-2">
                    {detail.lectures
                      .slice()
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((l) => (
                        <div key={l.id} className="rounded-2xl border border-[hsl(var(--border))] p-3">
                          <div className="text-sm font-medium">
                            {l.orderIndex}. {l.title}
                          </div>
                          <div className="mt-1 line-clamp-2 text-sm text-[hsl(var(--muted-fg))]">{l.description}</div>
                        </div>
                      ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="font-semibold">Lecture notes</div>
                <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">Markdown notes shown on the watch page for that lecture.</div>
              </CardHeader>
              <CardBody>
                <form onSubmit={saveLectureNotes} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm">Lecture</label>
                    <select
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                      value={notesLectureId}
                      onChange={(e) => setNotesLectureId(e.target.value)}
                    >
                      <option value="">Select lecture…</option>
                      {detail.lectures
                        .slice()
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.orderIndex}. {l.title}
                          </option>
                        ))}
                    </select>
                    <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">Notes are saved per lecture.</div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Notes (Markdown)</label>
                    <Textarea value={notesMd} onChange={(e) => setNotesMd(e.target.value)} rows={6} placeholder="### Key points\n- ..." />
                  </div>
                  {error ? <div className="text-sm text-red-600">{error}</div> : null}
                  <Button disabled={busy || !notesLectureId} className="w-full sm:w-auto">
                    {busy ? 'Saving…' : 'Save notes'}
                  </Button>
                </form>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="font-semibold">Course attachments</div>
                <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">Upload assignments/resources for the whole course.</div>
              </CardHeader>
              <CardBody>
                <form onSubmit={uploadCourseAttachment} className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm">Title (optional)</label>
                    <Input value={attTitle} onChange={(e) => setAttTitle(e.target.value)} placeholder="Assignment 1" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm">File</label>
                    <input
                      type="file"
                      onChange={(e) => setAttFile(e.target.files?.[0] ?? null)}
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  {error ? <div className="sm:col-span-2 text-sm text-red-600">{error}</div> : null}
                  <div className="sm:col-span-2">
                    <Button disabled={busy} className="w-full sm:w-auto">
                      {busy ? 'Uploading…' : 'Upload attachment'}
                    </Button>
                  </div>
                </form>

                <div className="mt-4 space-y-2">
                  {courseAttachments === null ? (
                    <Skeleton className="h-10 w-full" />
                  ) : courseAttachments.length === 0 ? (
                    <div className="text-sm text-[hsl(var(--muted-fg))]">No course attachments yet.</div>
                  ) : (
                    courseAttachments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--border))] px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{a.title}</div>
                          <div className="mt-0.5 text-xs text-[hsl(var(--muted-fg))]">{a.mimeType}{a.sizeBytes ? ` • ${Math.round(a.sizeBytes / 1024)} KB` : ''}</div>
                        </div>
                        <Button disabled={busy} variant="ghost" onClick={() => deleteAttachment(a.id)}>
                          Delete
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="font-semibold">Lecture attachments</div>
                <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">Upload assignments/resources for a specific lecture.</div>
              </CardHeader>
              <CardBody>
                <form onSubmit={uploadLectureAttachment} className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm">Lecture</label>
                    <select
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                      value={attLectureId}
                      onChange={(e) => setAttLectureId(e.target.value)}
                    >
                      <option value="">Select lecture…</option>
                      {detail.lectures
                        .slice()
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.orderIndex}. {l.title}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm">Title (optional)</label>
                    <Input value={attLectureTitle} onChange={(e) => setAttLectureTitle(e.target.value)} placeholder="Worksheet" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm">File</label>
                    <input
                      type="file"
                      onChange={(e) => setAttLectureFile(e.target.files?.[0] ?? null)}
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  {error ? <div className="sm:col-span-2 text-sm text-red-600">{error}</div> : null}
                  <div className="sm:col-span-2">
                    <Button disabled={busy || !attLectureId} className="w-full sm:w-auto">
                      {busy ? 'Uploading…' : 'Upload attachment'}
                    </Button>
                  </div>
                </form>

                <div className="mt-4 space-y-2">
                  {!attLectureId ? (
                    <div className="text-sm text-[hsl(var(--muted-fg))]">Select a lecture to view attachments.</div>
                  ) : lectureAttachments === null ? (
                    <Skeleton className="h-10 w-full" />
                  ) : lectureAttachments.length === 0 ? (
                    <div className="text-sm text-[hsl(var(--muted-fg))]">No lecture attachments yet.</div>
                  ) : (
                    lectureAttachments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--border))] px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{a.title}</div>
                          <div className="mt-0.5 text-xs text-[hsl(var(--muted-fg))]">{a.mimeType}{a.sizeBytes ? ` • ${Math.round(a.sizeBytes / 1024)} KB` : ''}</div>
                        </div>
                        <Button disabled={busy} variant="ghost" onClick={() => deleteAttachment(a.id)}>
                          Delete
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
