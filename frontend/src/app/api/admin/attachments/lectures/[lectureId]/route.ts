import { proxyToBackend } from '../../../../_proxy';

export async function GET(req: Request, ctx: { params: Promise<{ lectureId: string }> }) {
  const { lectureId } = await ctx.params;
  return proxyToBackend(req, `/admin/attachments/lectures/${lectureId}`);
}

export async function POST(req: Request, ctx: { params: Promise<{ lectureId: string }> }) {
  const { lectureId } = await ctx.params;
  const body = await req.text();
  return proxyToBackend(req, `/admin/attachments/lectures/${lectureId}`, {
    method: 'POST',
    headers: { 'content-type': req.headers.get('content-type') ?? 'application/json' },
    body
  });
}
