import { proxyToBackend } from '../../../_proxy';

export async function PUT(req: Request, ctx: { params: Promise<{ lectureId: string }> }) {
  const { lectureId } = await ctx.params;
  const body = await req.text();
  return proxyToBackend(req, `/lectures/${lectureId}/progress`, {
    method: 'PUT',
    headers: { 'content-type': req.headers.get('content-type') ?? 'application/json' },
    body
  });
}
