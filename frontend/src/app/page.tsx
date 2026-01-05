import Link from 'next/link';
import { PublicShell } from '@/components/app/public-shell';
import { Button, Card, CardBody, CardHeader } from '@/components/ui';

export default function HomePage() {
  return (
    <PublicShell>
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="inline-flex items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs text-[hsl(var(--muted-fg))]">
            Learn with secure video access
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Watch video courses, track progress, and download resources.
          </h1>
          <p className="mt-3 max-w-prose text-[hsl(var(--muted-fg))]">
            Create an account, purchase a course, and start learning instantly. Videos stream via short-lived signed URLs,
            and your progress is saved automatically.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/courses">
              <Button>Browse courses</Button>
            </Link>
            <Link href="/signup">
              <Button variant="ghost">Create account</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
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
                  title: 'Per-course access',
                  desc: 'Purchase a course once and unlock all lectures.'
                },
                {
                  title: 'Notes and resources',
                  desc: 'Download assignments/resources and view lecture notes while watching.'
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
            <div className="text-sm font-semibold">Resume</div>
          </CardHeader>
          <CardBody>
            <div className="text-sm text-[hsl(var(--muted-fg))]">Pick up where you left off with saved playback progress.</div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">Resources</div>
          </CardHeader>
          <CardBody>
            <div className="text-sm text-[hsl(var(--muted-fg))]">Access lecture attachments and notes when available.</div>
          </CardBody>
        </Card>
      </div>
    </PublicShell>
  );
}
