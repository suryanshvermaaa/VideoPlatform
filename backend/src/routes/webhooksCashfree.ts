import { Router } from 'express';

import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../lib/prisma.js';
import { verifyCashfreeWebhookSignature, cashfreeIdempotencyKey } from '../lib/cashfreeWebhook.js';

const router = Router();

type CashfreeWebhook = {
  type: string;
  event_time?: string;
  data?: {
    order?: { order_id?: string };
    payment?: { cf_payment_id?: string; payment_status?: string };
  };
};

router.post(
  '/cashfree',
  asyncHandler(async (req, res) => {
    const raw = req.rawBody;
    if (!raw) {
      // Signature verification needs raw body; this indicates middleware misconfiguration.
      return res.status(500).json({ message: 'Missing raw body' });
    }

    verifyCashfreeWebhookSignature(raw, req.headers as any);

    const idem = cashfreeIdempotencyKey(req.headers as any);

    const payload = req.body as CashfreeWebhook;
    const orderId = payload?.data?.order?.order_id;
    if (!orderId) return res.status(400).json({ message: 'Missing order_id' });

    const paymentStatus = payload?.data?.payment?.payment_status;
    const cfPaymentId = payload?.data?.payment?.cf_payment_id;

    // Idempotency: store raw payload and only process first time per order.
    const record = await prisma.payment.findUnique({ where: { providerOrderId: orderId } });
    if (!record) {
      // Unknown order; acknowledge to avoid retries.
      return res.status(200).json({ ok: true, ignored: true });
    }

    if (record.status === 'PAID') {
      return res.status(200).json({ ok: true, alreadyProcessed: true, idempotencyKey: idem ?? null });
    }

    if (paymentStatus === 'SUCCESS') {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: record.id },
          data: {
            status: 'PAID',
            providerPaymentId: cfPaymentId ?? record.providerPaymentId,
            rawPayload: payload as any
          }
        });

        // Ensure coupon redemption count is incremented once.
        if (record.couponId) {
          await tx.coupon.update({
            where: { id: record.couponId },
            data: { redeemedCount: { increment: 1 } }
          });
        }

        // Grant course access after successful payment.
        await tx.courseAssignment.upsert({
          where: { userId_courseId: { userId: record.userId, courseId: record.courseId } },
          update: {},
          create: { userId: record.userId, courseId: record.courseId }
        });
      });
    } else if (paymentStatus === 'FAILED' || paymentStatus === 'USER_DROPPED') {
      await prisma.payment.update({
        where: { id: record.id },
        data: { status: 'FAILED', providerPaymentId: cfPaymentId ?? record.providerPaymentId, rawPayload: payload as any }
      });
    } else {
      // Other events: store payload for troubleshooting.
      await prisma.payment.update({ where: { id: record.id }, data: { rawPayload: payload as any } });
    }

    return res.status(200).json({ ok: true, idempotencyKey: idem ?? null });
  })
);

export default router;
