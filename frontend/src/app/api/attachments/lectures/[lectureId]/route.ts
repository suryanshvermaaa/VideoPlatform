import { proxyToBackend } from '../../../_proxy';

export async function GET(req: Request, ctx: { params: Promise<{ lectureId: string }> }) {
  const { lectureId } = await ctx.params;
  return proxyToBackend(req, `/attachments/lectures/${lectureId}`);
}
