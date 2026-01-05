import { proxyToBackend } from '../../../_proxy';

export async function PATCH(req: Request, ctx: { params: Promise<{ lectureId: string }> }) {
  const { lectureId } = await ctx.params;
  const body = await req.text();
  return proxyToBackend(req, `/admin/lectures/${lectureId}`, {
    method: 'PATCH',
    headers: { 'content-type': req.headers.get('content-type') ?? 'application/json' },
    body
  });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ lectureId: string }> }) {
  const { lectureId } = await ctx.params;
  return proxyToBackend(req, `/admin/lectures/${lectureId}`, { method: 'DELETE' });
}
