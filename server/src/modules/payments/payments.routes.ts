import { Router } from 'express';
import { createPaymentOrderSchema, paymentFailedSchema, verifyPaymentSchema } from '@vorizon/shared';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';
import { logger } from '../../utils/logger.js';
import * as svc from './payments.service.js';

export const paymentRoutes = Router();

/**
 * Razorpay webhook — mounted BEFORE requireAuth (Razorpay can't send our JWT).
 * Authenticity comes from the HMAC signature over the raw body instead.
 * Configure the same secret in Dashboard → Settings → Webhooks.
 */
paymentRoutes.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const signature = req.header('x-razorpay-signature') ?? '';
    if (!req.rawBody || !signature || !svc.verifyWebhookSignature(req.rawBody, signature)) {
      throw ApiError.unauthorized('Invalid webhook signature');
    }

    const event = req.body as {
      event: string;
      payload?: { payment?: { entity?: { id: string; order_id: string; error_description?: string } } };
    };
    const payment = event.payload?.payment?.entity;

    if (event.event === 'payment.captured' && payment) {
      await svc.markPaid(payment.order_id, payment.id, 'webhook');
    } else if (event.event === 'payment.failed' && payment) {
      await svc.markFailed(payment.order_id, payment.error_description ?? 'Payment failed');
    } else {
      logger.info({ event: event.event }, 'Ignoring unhandled Razorpay webhook event');
    }
    // Always 200 for processed events so Razorpay doesn't retry forever.
    res.json({ received: true });
  }),
);

paymentRoutes.use(requireAuth);

// Create a payment order — owner/admin only. Returns what Checkout needs.
paymentRoutes.post(
  '/order',
  requireRole('owner', 'admin'),
  validate(createPaymentOrderSchema),
  asyncHandler(async (req, res) => {
    const dto = await svc.createOrder(req.user!.organizationId, req.user!.userId, req.body);
    res.status(201).json({ data: dto });
  }),
);

// Success flow: verify the Checkout signature server-side, then activate billing.
paymentRoutes.post(
  '/verify',
  validate(verifyPaymentSchema),
  asyncHandler(async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    await svc.assertOrderInOrg(req.user!.organizationId, razorpayOrderId);

    if (!svc.verifyCheckoutSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      await svc.markFailed(razorpayOrderId, 'Signature verification failed');
      throw ApiError.badRequest('Payment signature verification failed');
    }
    const dto = await svc.markPaid(razorpayOrderId, razorpayPaymentId, 'checkout');
    res.json({ data: dto });
  }),
);

// Failure flow: Checkout reported failure/dismissal (webhook also covers this).
paymentRoutes.post(
  '/failed',
  validate(paymentFailedSchema),
  asyncHandler(async (req, res) => {
    await svc.assertOrderInOrg(req.user!.organizationId, req.body.razorpayOrderId);
    const dto = await svc.markFailed(req.body.razorpayOrderId, req.body.reason ?? 'Cancelled by user');
    res.json({ data: dto });
  }),
);

// Payment history for the org.
paymentRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await svc.listPayments(req.user!.organizationId);
    res.json({ data: items });
  }),
);
