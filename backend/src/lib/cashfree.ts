import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';

function cashfreeBaseUrl() {
  return env.CASHFREE_ENV === 'PRODUCTION' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com';
}

export type CashfreeCreateOrderRequest = {
  order_id: string;
  order_amount: number;
  order_currency: 'INR';
  customer_details: {
    customer_id: string;
    customer_email?: string | null;
    customer_phone: string;
    customer_name?: string | null;
  };
  order_meta?: {
    return_url?: string;
    notify_url?: string;
  };
  order_note?: string;
};

export type CashfreeCreateOrderResponse = {
  cf_order_id: string;
  order_id: string;
  order_status: string;
  payment_session_id: string;
};

export async function cashfreeCreateOrder(request: CashfreeCreateOrderRequest): Promise<CashfreeCreateOrderResponse> {
  if (!env.CASHFREE_CLIENT_ID || !env.CASHFREE_CLIENT_SECRET) {
    throw new HttpError(500, 'Cashfree not configured');
  }

  const res = await fetch(`${cashfreeBaseUrl()}/pg/orders`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-version': env.CASHFREE_API_VERSION,
      'x-client-id': env.CASHFREE_CLIENT_ID,
      'x-client-secret': env.CASHFREE_CLIENT_SECRET
    },
    body: JSON.stringify(request)
  });

  const text = await res.text();
  if (!res.ok) {
    throw new HttpError(502, `Cashfree create order failed: ${text}`);
  }

  return JSON.parse(text) as CashfreeCreateOrderResponse;
}
