import httpStatus from "http-status";
import axios from "axios";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Order } from "./order.model";
import { TOrder } from "./order.interface";
import { OrderSearchableFields } from "./order.constant";
import { CourseLicense } from "../courseLicense/courseLicense.model";
import { EnrolledCourse } from "../enrolledCourse/enrolledCourse.model";

// ─── Worldpay Config ──────────────────────────────────────────────────────────
// Sandbox:  https://try.access.worldpay.com
// Live:     https://access.worldpay.com
const WORLDPAY_BASE_URL =
  process.env.WORLDPAY_BASE_URL || "https://try.access.worldpay.com";
const WORLDPAY_SERVICE_KEY = process.env.WORLDPAY_SERVICE_KEY!;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/** Base64-encode the service key for Basic Auth */
const worldpayAuthHeader = () =>
  `Basic ${Buffer.from(`${WORLDPAY_SERVICE_KEY}:`).toString("base64")}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Enroll student courses after confirmed payment */
const enrollStudentCourses = async (order: any) => {
  for (const item of order.items || []) {
    await EnrolledCourse.create({
      studentId: order.buyerId,
      courseId: item.courseId,
      purchasedBy: order.buyerId,
      status: "active",
      progress: 0,
      startDate: new Date(),
    });
  }
};

/** Create company course licenses after confirmed payment */
const createCompanyLicenses = async (order: any) => {
  for (const item of order.items || []) {
    await CourseLicense.create({
      companyId: order.buyerId,
      courseId: item.courseId,
      orderId: order._id,
      totalSeats: item.quantity,
      usedSeats: 0,
      isActive: true,
    });
  }
};

// ─── Service Functions ────────────────────────────────────────────────────────

const getAllOrderFromDB = async (query: Record<string, unknown>) => {
  const OrderQuery = new QueryBuilder(
    Order.find().populate("buyerId", "name").populate({
      path: "items.courseId",
      select: "title",
    }),
    query,
  )
    .search(OrderSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await OrderQuery.countTotal();
  const result = await OrderQuery.modelQuery;

  return { meta, result };
};

const getSingleOrderFromDB = async (id: string) => {
  const result = await Order.findById(id);
  return result;
};

const updateOrderIntoDB = async (id: string, payload: Partial<TOrder>) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  const result = await Order.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

/**
 * STEP 1 — Called when user clicks "Pay Now" on the checkout page.
 *
 * 1. Creates a PENDING order in the database.
 * 2. Requests a Hosted Payment Page session from Worldpay.
 * 3. Returns the Worldpay redirect URL to the frontend.
 *
 * The frontend then does: window.location.href = redirectUrl
 */
const initiateWorldpayPayment = async (
  payload: Partial<TOrder> & { shippingDetails?: Record<string, string> },
) => {
  const { totalAmount, shippingDetails } = payload;

  if (!totalAmount || totalAmount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid order amount");
  }

  // 1. Persist a pending order so we have an ID to track
  const order = await Order.create({
    ...payload,
    paymentStatus: "pending",
  });

  const orderId = order._id.toString();

  // 2. Create a Worldpay Hosted Payment Page session
  //    Docs: https://developer.worldpay.com/docs/access-worldpay/hpp
  try {
    const worldpayRes = await axios.post(
      `${WORLDPAY_BASE_URL}/hpp/sessions`,
      {
        transactionReference: orderId, // echoed back in webhook
        merchant: {
          entity: "default", // replace with your Worldpay merchant entity
        },
        instruction: {
          narrative: {
            line1: "Course Purchase",
          },
          value: {
            currency: "GBP", // ← change to match your Worldpay account currency
            amount: Math.round(totalAmount * 100), // pence / cents (minor units)
          },
        },
        customer: {
          // Pre-fill Worldpay's hosted form with billing details
          ...(shippingDetails?.email && { email: shippingDetails.email }),
          ...(shippingDetails?.fullName && {
            billingAddress: {
              firstName: shippingDetails.fullName.split(" ")[0] || "",
              lastName:
                shippingDetails.fullName.split(" ").slice(1).join(" ") || "",
              address1: shippingDetails.address || "",
              city: shippingDetails.city || "",
              state: shippingDetails.state || "",
              postalCode: shippingDetails.zipCode || "",
              countryCode: shippingDetails.country || "",
            },
          }),
        },
        successUrl: `${FRONTEND_URL}/payment/success?orderId=${orderId}`,
        failureUrl: `${FRONTEND_URL}/payment/failure?orderId=${orderId}`,
        pendingUrl: `${FRONTEND_URL}/payment/pending?orderId=${orderId}`,
        cancelUrl: `${FRONTEND_URL}/checkout`,
      },
      {
        headers: {
          Authorization: worldpayAuthHeader(),
          "Content-Type": "application/json",
        },
      },
    );

    const redirectUrl =
      worldpayRes.data?.redirectUrl || worldpayRes.data?.links?.hpp?.href;

    if (!redirectUrl) {
      // Clean up the pending order if Worldpay doesn't give us a URL
      await Order.findByIdAndDelete(orderId);
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        "Failed to retrieve Worldpay payment URL",
      );
    }

    return { redirectUrl, orderId };
  } catch (err: any) {
    // Re-throw AppErrors as-is
    if (err instanceof AppError) throw err;

    // Clean up pending order on Worldpay API failure
    await Order.findByIdAndDelete(orderId);

    const worldpayMsg =
      err?.response?.data?.message || err?.message || "Worldpay request failed";
    throw new AppError(httpStatus.BAD_GATEWAY, worldpayMsg);
  }
};

/**
 * STEP 2 — Called by Worldpay's webhook after the payment is processed.
 *
 * Worldpay will POST to: POST /api/order/webhook/worldpay
 * (Register this URL in your Worldpay dashboard under Notifications)
 *
 * On SUCCESS  → marks order as "paid", enrolls students / creates licenses.
 * On FAILURE  → marks order as "failed".
 *
 * Important: This route must NOT have auth middleware.
 */
const handleWorldpayWebhook = async (webhookPayload: any) => {
  // Worldpay sends different event shapes depending on your account config.
  // Adapt the field names below to match your actual webhook payload.
  const {
    transactionReference, // this is the orderId we passed in initiateWorldpayPayment
    orderCode, // alternative field name Worldpay sometimes uses
    paymentStatus, // "SUCCESS" | "FAILED" | "PENDING"
    outcome, // alternative: "authorized" | "refused"
    transactionIdentifier,
    orderDetails,
  } = webhookPayload;

  const orderId = transactionReference || orderCode || orderDetails?.orderCode;

  if (!orderId) {
    console.error("Worldpay webhook: missing order reference", webhookPayload);
    return { received: true };
  }

  const order = await Order.findById(orderId);
  if (!order) {
    console.error(`Worldpay webhook: order ${orderId} not found`);
    return { received: true };
  }

  // Normalise the success condition across both Worldpay API flavours
  const isSuccess = paymentStatus === "SUCCESS" || outcome === "authorized";

  const isFailed =
    paymentStatus === "FAILED" ||
    paymentStatus === "REFUSED" ||
    outcome === "refused";

  if (isSuccess && order.paymentStatus !== "paid") {
    // Mark paid and store the transaction ID
    order.paymentStatus = "paid";
    order.transactionId =
      transactionIdentifier ||
      webhookPayload?.paymentResponse?.transactionIdentifier;
    await order.save();

    // Fulfill the order
    if (order.role === "student") {
      await enrollStudentCourses(order);
    }
    if (order.role === "company") {
      await createCompanyLicenses(order);
    }

    console.log(`✅ Order ${orderId} marked as paid.`);
  } else if (isFailed && order.paymentStatus !== "failed") {
    order.paymentStatus = "failed";
    await order.save();
    console.log(`❌ Order ${orderId} marked as failed.`);
  }

  return { received: true };
};

/**
 * Lightweight poll endpoint — called by the frontend's success page every
 * few seconds to check whether the webhook has confirmed payment yet.
 */
const getOrderPaymentStatus = async (id: string) => {
  const order = await Order.findById(id).select(
    "paymentStatus transactionId createdAt",
  );
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }
  return order;
};

// Legacy direct-create (kept for admin use)
const createOrderIntoDB = async (payload: Partial<TOrder>) => {
  const order = await Order.create(payload);
  const { buyerId, role, items } = payload;

  if (role === "student") {
    for (const item of items || []) {
      await EnrolledCourse.create({
        studentId: buyerId,
        courseId: item.courseId,
        purchasedBy: buyerId,
        status: "active",
        progress: 0,
        startDate: new Date(),
      });
    }
  }

  if (role === "company") {
    for (const item of items || []) {
      await CourseLicense.create({
        companyId: payload.buyerId,
        courseId: item.courseId,
        orderId: order._id,
        totalSeats: item.quantity,
        usedSeats: 0,
        isActive: true,
      });
    }
  }

  return order;
};

export const OrderServices = {
  getAllOrderFromDB,
  getSingleOrderFromDB,
  updateOrderIntoDB,
  createOrderIntoDB,
  initiateWorldpayPayment, // ← NEW: step 1 — create pending order + get redirect URL
  handleWorldpayWebhook, // ← NEW: step 2 — called by Worldpay after payment
  getOrderPaymentStatus, // ← NEW: step 3 — polled by frontend success page
};
