import { proxyToBackend } from '../../../_proxy';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.text();
  return proxyToBackend(req, `/admin/storage-providers/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': req.headers.get('content-type') ?? 'application/json' },
    body
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(req, `/admin/storage-providers/${id}`, {
    method: 'DELETE'
  });
}
