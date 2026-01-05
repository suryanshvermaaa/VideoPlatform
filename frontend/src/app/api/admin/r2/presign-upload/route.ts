import { proxyToBackend } from '../../../_proxy';

export async function POST(req: Request) {
  const body = await req.text();
  return proxyToBackend(req, '/admin/r2/presign-upload', {
    method: 'POST',
    headers: { 'content-type': req.headers.get('content-type') ?? 'application/json' },
    body
  });
}
