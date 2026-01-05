import { proxyToBackend } from '../../_proxy';

export async function GET(req: Request) {
  return proxyToBackend(req, '/admin/courses');
}

export async function POST(req: Request) {
  const body = await req.text();
  return proxyToBackend(req, '/admin/courses', {
    method: 'POST',
    headers: { 'content-type': req.headers.get('content-type') ?? 'application/json' },
    body
  });
}
