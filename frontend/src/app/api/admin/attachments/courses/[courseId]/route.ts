import { proxyToBackend } from '../../../../_proxy';

export async function GET(req: Request, ctx: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await ctx.params;
  return proxyToBackend(req, `/admin/attachments/courses/${courseId}`);
}

export async function POST(req: Request, ctx: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await ctx.params;
  const body = await req.text();
  return proxyToBackend(req, `/admin/attachments/courses/${courseId}`, {
    method: 'POST',
    headers: { 'content-type': req.headers.get('content-type') ?? 'application/json' },
    body
  });
}
