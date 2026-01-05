import { proxyToBackend } from '../../../_proxy';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyToBackend(req, `/attachments/${id}/download-url`);
}
