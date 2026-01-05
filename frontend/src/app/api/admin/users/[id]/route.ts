import { proxyToBackend } from '../../../_proxy';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyToBackend(req, `/admin/users/${id}`);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.text();
  return proxyToBackend(req, `/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': req.headers.get('content-type') ?? 'application/json' },
    body
  });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyToBackend(req, `/admin/users/${id}`, { method: 'DELETE' });
}
