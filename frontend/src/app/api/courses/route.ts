import { proxyToBackend } from '../_proxy';

export async function GET(req: Request) {
  return proxyToBackend(req, '/courses');
}
