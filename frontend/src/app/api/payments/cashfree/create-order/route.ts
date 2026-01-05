import { proxyToBackend } from '@/app/api/_proxy';

export async function POST(req: Request) {
  return proxyToBackend(req, '/payments/cashfree/create-order');
}
