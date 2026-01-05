import { proxyToBackend } from '../../../_proxy';

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyToBackend(req, `/admin/attachments/${id}`, {
    method: 'DELETE'
  });
}
