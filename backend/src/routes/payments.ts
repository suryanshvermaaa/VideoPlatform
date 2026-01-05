import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { cashfreeCreateOrder } from '../lib/cashfree.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';

const router = Router();

function toInr(amountPaise: number) {
  return Math.round(amountPaise) / 100;
}

function discountAmountPaise(coursePaise: number, coupon: { percentOff: number | null; amountOffPaise: number | null }) {
  if (coupon.percentOff) {
    return Math.floor((coursePaise * coupon.percentOff) / 100);
  }
  return Math.min(coursePaise, coupon.amountOffPaise ?? 0);
}

router.post(
  '/cashfree/create-order',
  validateBody(
    z.object({
      courseId: z.string().min(1),
      couponCode: z.string().min(3).max(32).optional(),
      phone: z.string().min(8).max(20)
    })
  ),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { courseId, couponCode, phone } = req.body as { courseId: string; couponCode?: string; phone: string };

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new HttpError(404, 'Course not found');

    // If already assigned, no need to pay.
    const existingAssignment = await prisma.courseAssignment.findUnique({
      where: { userId_courseId: { userId, courseId } }
    });
    if (existingAssignment) {
      throw new HttpError(409, 'Course already assigned');
    }

    let coupon: { id: string; percentOff: number | null; amountOffPaise: number | null } | null = null;
    if (couponCode) {
      const found = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (!found) throw new HttpError(400, 'Invalid coupon');
      if (!found.active) throw new HttpError(400, 'Coupon inactive');
      if (found.expiresAt && found.expiresAt.getTime() < Date.now()) throw new HttpError(400, 'Coupon expired');
      if (found.courseId && found.courseId !== courseId) throw new HttpError(400, 'Coupon not valid for this course');
      if (found.maxRedemptions && found.redeemedCount >= found.maxRedemptions) throw new HttpError(400, 'Coupon exhausted');

      coupon = { id: found.id, percentOff: found.percentOff, amountOffPaise: found.amountOffPaise };
    }

    const base = course.priceInrPaise;
    const discount = coupon ? discountAmountPaise(base, coupon) : 0;
    const payable = Math.max(0, base - discount);

    if (payable === 0) {
      await prisma.courseAssignment.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: {},
        create: { userId, courseId }
      });
      return res.json({ assigned: true, free: true });
    }

    // NOTE: Cashfree order_id must be 3-45 chars [a-zA-Z0-9_-]
    const providerOrderId = `vp_${courseId.slice(0, 8)}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } });
    if (!me) throw new HttpError(401, 'Unauthorized');

    const cf = await cashfreeCreateOrder({
      order_id: providerOrderId,
      order_amount: toInr(payable),
      order_currency: 'INR',
      customer_details: {
        customer_id: me.id,
        customer_email: me.email,
        customer_name: me.name ?? undefined,
        customer_phone: phone
      },
      order_meta: {
        return_url: `${env.APP_BASE_URL}/courses/${encodeURIComponent(courseId)}?order_id=${encodeURIComponent(providerOrderId)}`,
        notify_url: `${env.PUBLIC_BACKEND_URL}/webhooks/cashfree`
      }
    });

    const payment = await prisma.payment.create({
      data: {
        provider: 'CASHFREE',
        providerOrderId,
        userId,
        courseId,
        amount: (payable / 100).toFixed(2),
        currency: 'INR',
        status: 'CREATED',
        couponId: coupon?.id
      }
    });

    res.json({
      payment: { id: payment.id, providerOrderId },
      cashfree: {
        paymentSessionId: cf.payment_session_id,
        orderId: cf.order_id,
        mode: env.CASHFREE_ENV === 'PRODUCTION' ? 'production' : 'sandbox'
      }
    });
  })
);

export default router;
