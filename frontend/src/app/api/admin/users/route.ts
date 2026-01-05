import { proxyToBackend } from '../../_proxy';

export async function GET(req: Request) {
  return proxyToBackend(req, '/admin/users');
}

export async function POST(req: Request) {
  const body = await req.text();
  return proxyToBackend(req, '/admin/users', {
    method: 'POST',
    headers: { 'content-type': req.headers.get('content-type') ?? 'application/json' },
    body
  });
}
