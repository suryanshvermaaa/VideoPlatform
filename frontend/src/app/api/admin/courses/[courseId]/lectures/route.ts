import { proxyToBackend } from '../../../../_proxy';

export async function POST(req: Request, ctx: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await ctx.params;
  const body = await req.text();
  return proxyToBackend(req, `/admin/courses/${courseId}/lectures`, {
    method: 'POST',
    headers: { 'content-type': req.headers.get('content-type') ?? 'application/json' },
    body
  });
}
