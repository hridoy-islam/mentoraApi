import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { OrderServices } from "./order.service";

const getAllOrder: RequestHandler = catchAsync(async (req, res) => {
  const result = await OrderServices.getAllOrderFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Orders retrieved successfully",
    data: result,
  });
});

const getSingleOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await OrderServices.getSingleOrderFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order is retrieved successfully",
    data: result,
  });
});

const updateOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await OrderServices.updateOrderIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order is updated successfully",
    data: result,
  });
});

const createOrder: RequestHandler = catchAsync(async (req, res) => {
  const result = await OrderServices.createOrderIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Order created successfully",
    data: result,
  });
});

/**
 * POST /api/order/initiate-payment
 *
 * Called by the checkout page when the user clicks "Proceed to Payment".
 * Creates a pending order in DB and returns a Stripe Checkout redirect URL.
 * Requires auth middleware.
 */
const initiatePayment: RequestHandler = catchAsync(async (req, res) => {
  const result = await OrderServices.initiateStripePayment(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment session created",
    data: result, // { redirectUrl, orderId }
  });
});

/**
 * POST /api/order/webhook/stripe
 *
 * Called by Stripe after a payment event occurs.
 * Register this URL in your Stripe Dashboard:
 *   Developers → Webhooks → Add endpoint
 *   URL: https://yourdomain.com/api/order/webhook/stripe
 *   Events: checkout.session.completed, checkout.session.expired
 *
 * ⚠️  IMPORTANT:
 *   - Do NOT add auth middleware to this route.
 *   - This route must use express.raw({ type: 'application/json' })
 *     (already handled in the router) so Stripe's signature check works.
 *   - Stripe expects a 200 response — anything else triggers a retry.
 */
const stripeWebhook: RequestHandler = async (req, res) => {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    res.status(400).json({ error: "Missing Stripe signature header" });
    return;
  }

  try {
    // req.body here is a raw Buffer (because of express.raw middleware in router)
    await OrderServices.handleStripeWebhook(req.body as Buffer, signature);
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook error:", error.message);
    res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/order/payment-status/:id
 *
 * Lightweight poll endpoint for the frontend /payment/success page.
 * Returns paymentStatus so the frontend knows when to stop polling.
 * Requires auth middleware.
 */
const getPaymentStatus: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await OrderServices.getOrderPaymentStatus(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment status retrieved",
    data: result,
  });
});

export const OrderControllers = {
  getAllOrder,
  getSingleOrder,
  updateOrder,
  createOrder,
  initiatePayment,  // ← STEP 1: create pending order + Stripe session
  stripeWebhook,    // ← STEP 2: Stripe calls this after payment
  getPaymentStatus, // ← STEP 3: frontend polls this to confirm payment
};