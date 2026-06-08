import express from "express";
import auth from "../../middlewares/auth";
import { OrderControllers } from "./order.controller";

const router = express.Router();

// ─── Standard CRUD ────────────────────────────────────────────────────────────

router.get("/", OrderControllers.getAllOrder);

router.post("/", OrderControllers.createOrder);

router.get("/:id", OrderControllers.getSingleOrder);

router.patch(
  "/:id",
  auth("admin", "instructor"),
  OrderControllers.updateOrder
);

// ─── Stripe Payment Flow ──────────────────────────────────────────────────────

/**
 * STEP 1 — User clicks "Pay Now"
 * Creates a pending order + returns a Stripe Checkout URL.
 * Protected: user must be logged in.
 */
router.post(
  "/initiate-payment",
  auth("admin", "student", "company"),
  OrderControllers.initiatePayment
);

/**
 * STEP 2 — Stripe webhook (called by Stripe after payment)
 *
 * ⚠️  express.raw() is REQUIRED here so Stripe can verify the request
 *     signature. Using express.json() will break signature verification
 *     and every webhook call will return 400.
 *
 * ⚠️  NO auth middleware — Stripe doesn't send auth tokens.
 *     Security is handled by verifying the stripe-signature header
 *     inside the controller using your STRIPE_WEBHOOK_SECRET.
 */
router.post(
  "/webhook/stripe",
  OrderControllers.stripeWebhook
);

/**
 * STEP 3 — Frontend polls this after being redirected to /payment/success
 * Returns paymentStatus so the page knows when the webhook has confirmed.
 * Protected: user must be logged in.
 */
router.get(
  "/payment-status/:id",
  auth("admin", "student", "company"),
  OrderControllers.getPaymentStatus
);

export const OrderRoutes = router;