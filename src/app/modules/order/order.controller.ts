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
    message: "Orders retrived succesfully",
    data: result,
  });
});
const getSingleOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await OrderServices.getSingleOrderFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order is retrieved succesfully",
    data: result,
  });
});

const updateOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await OrderServices.updateOrderIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order is updated succesfully",
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
 * Creates a pending order and returns a Worldpay redirect URL.
 * Requires auth middleware.
 */
const initiatePayment: RequestHandler = catchAsync(async (req, res) => {
  const result = await OrderServices.initiateWorldpayPayment(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment session created",
    data: result, // { redirectUrl, orderId }
  });
});
 
/**
 * POST /api/order/webhook/worldpay
 *
 * Called by Worldpay after a payment is processed.
 * Register this URL in your Worldpay dashboard under:
 *   Settings → Notifications → Webhook URL
 *
 * ⚠️  Do NOT add auth middleware to this route.
 *     Worldpay will not send auth headers.
 *     Verify authenticity via Worldpay's HMAC signature instead (see docs).
 */
const worldpayWebhook: RequestHandler = catchAsync(async (req, res) => {
  // Optional: verify Worldpay HMAC signature here
  // const signature = req.headers['x-worldpay-signature'];
  // verifyWorldpaySignature(signature, req.rawBody);
 
  await OrderServices.handleWorldpayWebhook(req.body);
  // Worldpay expects a 200 response — anything else triggers a retry
  res.status(200).json({ received: true });
});
 
/**
 * GET /api/order/payment-status/:id
 *
 * Lightweight poll endpoint for the frontend success page.
 * Returns just the paymentStatus field so the page knows when to stop polling.
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
  initiatePayment,    // ← NEW
  worldpayWebhook,    // ← NEW
  getPaymentStatus,   // ← NEW
};
 