# VideoPlatform (Next.js + Express + Prisma + S3/R2 + Cashfree)

Production-style monorepo for a private video course platform.

- Frontend: Next.js App Router (Tailwind, light/dark)
- Backend: Express + TypeScript + Prisma (Postgres)
- Storage: S3-compatible (Cloudflare R2 / AWS S3 / MinIO local) with signed URLs
- Auth: JWT access + refresh rotation (refresh stored hashed)
- Access control: admin-only upload/course creation; users can only watch assigned/purchased courses
- Payments: Cashfree per-course purchase (confirmed via webhook)

## Repo layout

- `backend/` Express API + Prisma
- `frontend/` Next.js app (proxies requests to backend)
- `docker-compose.yml` Postgres + MinIO (local dev)

## Prereqs

- Node.js 20+ recommended
- `pnpm` (workspace uses pnpm)
- Docker (for Postgres + MinIO)

## Quick start (local)

1) Install deps

```bash
pnpm install
```

2) Start local infra (Postgres + MinIO)

```bash
docker compose up -d
```

3) Configure env

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

4) Run migrations + generate Prisma Client

```bash
pnpm --dir backend prisma:migrate
```

5) Seed an admin user

```bash
pnpm --dir backend seed:admin
```

6) Start dev servers

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000/health
- MinIO console: http://localhost:9001 (user/pass: `minioadmin` / `minioadmin`)

## Environment variables

### Backend (`backend/.env`)

Key variables:

- `DATABASE_URL` Postgres connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (min 20 chars)
- `CORS_ORIGIN` should match frontend origin (`http://localhost:3000`)

S3-compatible storage (recommended):

- `S3_BUCKET_NAME`
- `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `S3_REGION`
- `S3_ENDPOINT` (set for MinIO / R2 / other S3-compatible)
- `S3_FORCE_PATH_STYLE=true` (needed for MinIO)

Dynamic storage providers (optional; enables adding multiple S3/R2/MinIO accounts from the admin UI):

- `STORAGE_PROVIDERS_ENC_KEY` a long random string used to encrypt provider secrets in the DB

Cashfree (optional; enables purchases + webhook processing):

- `CASHFREE_ENV=SANDBOX` or `PRODUCTION`
- `CASHFREE_CLIENT_ID`
- `CASHFREE_CLIENT_SECRET`
- `CASHFREE_API_VERSION=2025-01-01`
- `APP_BASE_URL` (where the user returns after payment)
- `PUBLIC_BACKEND_URL` (publicly reachable URL for webhook delivery)

### Frontend (`frontend/.env`)

- `BACKEND_URL=http://localhost:4000`

## Course access model

- Admins create courses/lectures and upload videos (videos remain private in S3/R2).
- Users can browse courses; a course is:
  - **Assigned** (admin granted access) OR
  - **Purchased** via Cashfree (webhook grants access by creating an assignment)
- Watch URLs are signed and short-lived.

## Coupons

- Coupons are managed by admin API routes under `/admin/coupons`.
- Coupons can be course-specific (or global), percent-off or fixed amount-off, with optional expiry and redemption limits.

## Testing Cashfree webhook locally (SANDBOX)

Cashfree must send webhooks to a **public** URL. For local dev, use a tunnel.

1) Start backend

```bash
pnpm --dir backend dev
```

2) Start a tunnel to port 4000 (pick one)

```bash
# ngrok
ngrok http 4000

# or cloudflared
cloudflared tunnel --url http://localhost:4000
```

3) Update `backend/.env`

- Set `PUBLIC_BACKEND_URL` to the tunnel URL (e.g. `https://xxxx.ngrok-free.app`)
- Keep `APP_BASE_URL=http://localhost:3000`

4) Configure webhook in Cashfree dashboard (SANDBOX)

- Webhook URL:
  - `https://YOUR_PUBLIC_BACKEND_URL/webhooks/cashfree`

5) Try a course purchase

- Open a locked course in the UI and click “Pay with Cashfree”.
- After successful payment, Cashfree sends the webhook; backend marks payment `PAID` and grants course access.
- If access doesn’t show instantly, refresh the course page (webhook processing can be a few seconds delayed).

Troubleshooting:

- If webhook returns `Missing raw body`, ensure backend is using the JSON parser with `verify` (already configured in `backend/src/server.ts`).
- If Cashfree signature verification fails, confirm:
  - `CASHFREE_CLIENT_SECRET` matches the environment in dashboard
  - `CASHFREE_ENV` is `SANDBOX`
  - You’re pointing Cashfree to the correct public URL

## “Prevent screen recording” note

Browsers do not provide a reliable way to fully block screen recording without DRM. The watch page includes deterrents (moving watermark, short-lived signed URLs, and disabling obvious download UI), but **it cannot guarantee prevention**.

## Scripts

From repo root:

- `pnpm dev` run frontend + backend in dev
- `pnpm build` build both packages

Package-specific:

- `pnpm --dir backend dev`
- `pnpm --dir backend prisma:migrate`
- `pnpm --dir backend seed:admin`
- `pnpm --dir backend course:bulk-upload -- --courseId <COURSE_ID> --folder <FOLDER_PATH>`
- `pnpm --dir frontend dev`

### Bulk upload lectures (from folder)

Uploads all video files from a local folder into your configured S3/R2/MinIO bucket, then creates `Lecture` records for the given course.

```bash
pnpm --dir backend course:bulk-upload -- \
  --courseId <COURSE_ID> \
  --folder </absolute/path/to/videos> \
  --concurrency 2
```

Options:

- `--startOrder <n>` start `orderIndex` at `n` (otherwise appends after the max existing lecture order)
- `--prefix <keyPrefix>` object key prefix (default: `videos/<courseId>/`)
- `--descriptionFile </path/to/description.md>` updates course `description` from file
- `--title <title>` updates course `title`
- `--priceInrPaise <n>` updates course price
- `--assignEmailsFile </path/to/emails.txt>` grants access by email (one per line)
- `--providerId <id>` upload to a specific storage provider (defaults to env / default provider)
- `--dryRun` prints what would happen without uploading/DB writes
