import { proxyToBackend } from '../../_proxy';

export async function GET(req: Request, ctx: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await ctx.params;
  return proxyToBackend(req, `/courses/${courseId}`);
}
