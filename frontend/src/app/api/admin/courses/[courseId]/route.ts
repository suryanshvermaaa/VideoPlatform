import { proxyToBackend } from '../../../_proxy';

export async function GET(req: Request, ctx: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await ctx.params;
  return proxyToBackend(req, `/admin/courses/${courseId}`);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await ctx.params;
  const body = await req.text();
  return proxyToBackend(req, `/admin/courses/${courseId}`, {
    method: 'PATCH',
    headers: { 'content-type': req.headers.get('content-type') ?? 'application/json' },
    body
  });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await ctx.params;
  return proxyToBackend(req, `/admin/courses/${courseId}`, { method: 'DELETE' });
}
