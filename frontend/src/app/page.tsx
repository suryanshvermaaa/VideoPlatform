import Link from 'next/link';
import { PublicShell } from '@/components/app/public-shell';
import { Button, Card, CardBody, CardHeader } from '@/components/ui';

export default function HomePage() {
  return (
    <PublicShell>
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="inline-flex items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs text-[hsl(var(--muted-fg))]">
            Private video courses with secure access
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Sell and deliver video courses with admin control.
          </h1>
          <p className="mt-3 max-w-prose text-[hsl(var(--muted-fg))]">
            Users sign up, purchase a course, and watch videos via short-lived signed URLs. Admins upload content and grant
            access. Progress is saved automatically.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/signup">
              <Button>Create account</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
          </div>

          <div className="mt-6 text-sm text-[hsl(var(--muted-fg))]">
            Admin?{' '}
            <Link className="underline" href="/login">
              Sign in
            </Link>{' '}
            to manage courses.
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">What you get</div>
            <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">A clean platform for learning and selling.</div>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3">
              {[
                {
                  title: 'Secure video delivery',
                  desc: 'Videos stay private in S3/R2/MinIO with signed URLs for playback.'
                },
                {
                  title: 'Per-course purchases',
                  desc: 'Cashfree checkout with webhook confirmation and coupon support.'
                },
                {
                  title: 'Admin-first controls',
                  desc: 'Create courses/lectures, upload videos, and grant access to users.'
                },
                {
                  title: 'Progress tracking',
                  desc: 'Playback progress is persisted at intervals so learners resume easily.'
                }
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-4"
                >
                  <div className="font-medium">{f.title}</div>
                  <div className="mt-1 text-sm text-[hsl(var(--muted-fg))]">{f.desc}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">Learn</div>
          </CardHeader>
          <CardBody>
            <div className="text-sm text-[hsl(var(--muted-fg))]">Watch assigned or purchased courses with a focused player.</div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">Manage</div>
          </CardHeader>
          <CardBody>
            <div className="text-sm text-[hsl(var(--muted-fg))]">Admin dashboard for users, courses, lectures, and uploads.</div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">Scale</div>
          </CardHeader>
          <CardBody>
            <div className="text-sm text-[hsl(var(--muted-fg))]">Bulk upload lectures from a folder using the backend script.</div>
          </CardBody>
        </Card>
      </div>
    </PublicShell>
  );
}
