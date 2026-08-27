import httpStatus from "http-status";
import Stripe from "stripe";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Order } from "./order.model";
import { TOrder } from "./order.interface";
import { OrderSearchableFields } from "./order.constant";
import { CourseLicense } from "../courseLicense/courseLicense.model";
import { EnrolledCourse } from "../enrolledCourse/enrolledCourse.model";
import moment from "moment";
import mongoose from "mongoose";
import { sendPaymentSuccessEmail } from "../../utils/sendPaymentSuccessEmail";

// ─── Stripe Config ────────────────────────────────────────────────────────────
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY as any);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ─── Order Reference Helpers ──────────────────────────────────────────────────

const ORDER_REF_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const randomOrderSuffix = (length = 6) => {
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += ORDER_REF_CHARS.charAt(
      Math.floor(Math.random() * ORDER_REF_CHARS.length)
    );
  }
  return suffix;
};

/**
 * Generate a unique `orderRef` in the format ORD-YYYYMMDD-XXXXXX.
 * Guards against duplicates: if the ref already exists in the DB,
 * regenerates a new suffix and retries until unique.
 */
const generateUniqueOrderRef = async (): Promise<string> => {
  const datePart = moment().format("YYYYMMDD");

  for (let attempt = 0; attempt < 5; attempt++) {
    const orderRef = `ORD-${datePart}-${randomOrderSuffix()}`;

    const existing = await Order.findOne({ orderRef }).select("_id");
    if (!existing) {
      return orderRef;
    }
    console.warn(`⚠️  orderRef ${orderRef} already exists — regenerating...`);
  }

  return generateUniqueOrderRef();
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShippingDetails {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface InitiatePaymentPayload extends Partial<TOrder> {
  shippingDetails?: ShippingDetails;
  items?: Array<{
    courseId: any;
    quantity: number;
    unitPrice: number;
    subTotal: number;
    title?: string;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Guard: throw if a student already has ANY of the requested courses enrolled.
 */
const assertStudentNotDuplicateEnrollment = async (
  studentId: string,
  items: Array<{ courseId: string }>
) => {
  const courseIds = items.map((i) => i.courseId);

  const existing = await EnrolledCourse.find({
    studentId: new mongoose.Types.ObjectId(studentId),
    courseId: { $in: courseIds.map((id) => new mongoose.Types.ObjectId(id)) },
  }).select("courseId");

  if (existing.length > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      `You have already enrolled in the following course(s). Please remove them from your cart.`
    );
  }
};

/**
 * Enroll student in all purchased courses.
 * Called only after payment is confirmed via webhook.
 */
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

/**
 * Upsert company course licenses after confirmed payment.
 */
const upsertCompanyLicenses = async (order: any) => {
  for (const item of order.items || []) {
    const existingLicense = await CourseLicense.findOne({
      companyId: order.buyerId,
      courseId: item.courseId,
    });

    if (existingLicense) {
      const logEntry = {
        orderId: order._id,
        seats: item.quantity,
        message: `Added ${item.quantity} seat(s) via order ${order._id}.`,
      };

      await CourseLicense.findByIdAndUpdate(
        existingLicense._id,
        {
          $inc: { totalSeats: item.quantity },
          $push: {
            orderIds: order._id,
            logs: logEntry,
          },
        },
        { new: true, runValidators: true }
      );
    } else {
      const logEntry = {
        orderId: order._id,
        seats: item.quantity,
        message:  `Course purchased with ${item.quantity} seat(s) via order ${order._id}.`,
      };

      await CourseLicense.create({
        companyId: order.buyerId,
        courseId: item.courseId,
        orderId: order._id,
        orderIds: [order._id],
        totalSeats: item.quantity,
        usedSeats: 0,
        isActive: true,
        logs: [logEntry],
      });
    }
  }
};

/**
 * Ensure the order has a non-empty `orderRef` before continuing.
 * Waits for it to be written, and if it never appears, generates one
 * and persists it so the confirmation email always has an order number.
 */
const waitForOrderRef = async (order: any, timeoutMs = 10000): Promise<string> => {
  const startedAt = Date.now();

  while (!order.orderRef && Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const fresh = await Order.findById(order._id).select("orderRef").lean();
    order.orderRef = fresh?.orderRef;
  }

  if (!order.orderRef) {
    order.orderRef = await generateUniqueOrderRef();
    order.orderRef = (await Order.findByIdAndUpdate(
      order._id,
      { orderRef: order.orderRef },
      { new: true }
    ))?.orderRef;
  }

  return order.orderRef;
};

/**
 * Send order confirmation email to the buyer.
 */
const sendOrderConfirmationEmail = async (order: any) => {
  try {
    await order.populate("buyerId", "+email name email");
    await order.populate({ path: "items.courseId", select: "title" });

    const buyer: any = order.buyerId;
    if (!buyer?.email) {
      console.error(`Order ${order._id}: buyer ${buyer?._id} has no email — skipping confirmation email`);
      return;
    }

    const items = order.items.map((item: any) => ({
      title: item.courseId?.title || `Course (${item.courseId})`,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subTotal: item.subTotal,
    }));

    const firstName = buyer.name?.trim().split(/\s+/)[0] || "Valued Customer";
    const courseName = items.map((i: any) => i.title).join(", ");
    const orderNumber = await waitForOrderRef(order);
    const purchaseDate = moment(order.createdAt).format("DD MMM YYYY");

    await sendPaymentSuccessEmail(buyer.email, {
      name: firstName,
      course_name: courseName,
      order_number: orderNumber,
      purchase_date: purchaseDate,
      amount_paid: order.totalAmount,
      transactionId: order.transactionId,
    });

    console.log(`📧 Confirmation email sent to ${buyer.email} for order ${order._id}`);
  } catch (err: any) {
    console.error(`Failed to send order confirmation email for order ${order._id}:`, err);
  }
};

// ─── Service Functions ────────────────────────────────────────────────────────

const getAllOrderFromDB = async (query: Record<string, unknown>) => {
  const queryObj = { ...query };
  const filterQuery: Record<string, any> = {};

  if (queryObj.year) {
    const year = Number(queryObj.year);
    filterQuery.createdAt = {
      $gte: moment.utc(`${year}-01-01`).startOf("year").toDate(),
      $lte: moment.utc(`${year}-01-01`).endOf("year").toDate(),
    };
    delete queryObj.year;
  }

  const OrderQuery = new QueryBuilder(
    Order.find(filterQuery)
      .populate("buyerId", "name")
      .populate({
        path: "items.courseId",
        select: "title",
      }),
    queryObj
  )
    .search(OrderSearchableFields)
    .filter(queryObj)
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

// ─── Stripe Payment ───────────────────────────────────────────────────────────

const initiateStripePayment = async (payload: InitiatePaymentPayload) => {
  const { totalAmount, shippingDetails, items, role, buyerId, discount, couponCode } = payload;
if (role === "student") {
  const hasMultipleQuantity = items?.some((item) => item.quantity > 1);

  if (hasMultipleQuantity) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can only purchase one access per course. Please adjust the quantity for each course to 1."
    );
  }
}

  if (!totalAmount || totalAmount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid order amount");
  }

  if (!items || items.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Order must contain at least one item");
  }

   if (role === "student") {}

  // ── Student duplicate-enrollment guard ──────────────────────────────────────
  if (role === "student" && buyerId) {
    await assertStudentNotDuplicateEnrollment(buyerId.toString(), items);
  }

  // ── Build the order document including shippingDetails ─────────────────────
  const orderRef = await generateUniqueOrderRef();

  const orderDoc = {
    buyerId,
    role,
    items: items.map(({ title: _title, ...item }) => item), // strip UI-only `title` field
    orderRef,
    totalAmount,
    discount: discount ?? 0,
    couponCode: couponCode ?? null,
    paymentStatus: "pending" as const,
    ...(shippingDetails && { shippingDetails }),
  };

  const order = await Order.create(orderDoc);
  const orderId = order._id.toString();

  try {
    // ── Build Stripe line_items ───────────────────────────────────────────────
    const lineItems: any = items.map(
      (item) => ({
        price_data: {
          currency: "gbp",
          product_data: {
            name: item.title || `Course (${item.courseId})`,
          },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      })
    );

    // Optional discount line item (negative amount)
    if (discount && Number(discount) > 0) {
      const subtotalSum = items.reduce((sum, item) => sum + item.subTotal, 0);
      const discountAmount = subtotalSum * Number(discount);

      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: `Discount (${(Number(discount) * 100).toFixed(0)}%)`,
          },
          unit_amount: -Math.round(discountAmount * 100),
        },
        quantity: 1,
      });
    }

    const sessionParams: any = {
      mode: "payment",
      line_items: lineItems,
      ...(shippingDetails?.email && { customer_email: shippingDetails.email }),
      metadata: {
        orderId,
        buyerId: buyerId?.toString() || "",
        role: role || "",
      },
      success_url: `${FRONTEND_URL}/payment/success?orderId=${orderId}`,
      cancel_url: `${FRONTEND_URL}`,
      
      billing_address_collection: "auto",
      ...(shippingDetails && {
        payment_intent_data: {
          description: "Course Purchase",
          metadata: { orderId },
          ...(shippingDetails.address && {
            shipping: {
              name: shippingDetails.fullName || "",
              address: {
                line1: shippingDetails.address,
                city: shippingDetails.city || "",
                state: shippingDetails.state || "",
                postal_code: shippingDetails.zipCode || "",
                country: shippingDetails.country || "",
              },
            },
          }),
        },
      }),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      await Order.findByIdAndDelete(orderId);
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        "Failed to retrieve Stripe checkout URL"
      );
    }

    await Order.findByIdAndUpdate(orderId, { stripeSessionId: session.id });

    return { redirectUrl: session.url, orderId };
  } catch (error: any) {
    // Clean up the pending order if Stripe session creation fails
    await Order.findByIdAndDelete(orderId);
    console.error("STRIPE ERROR:", error.message);
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      error.message || "Payment initiation failed"
    );
  }
};

// ─── Stripe Webhook ───────────────────────────────────────────────────────────

const handleStripeWebhook = async (rawBody: Buffer, signature: string) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set in .env");
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Webhook secret not configured"
    );
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(rawBody as any, signature, webhookSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err.message);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Webhook signature error: ${err.message}`
    );
  }

  console.log(`📩 Stripe event received: ${event.type}`);

  // ── Payment succeeded ──────────────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.error("Stripe webhook: missing orderId in session metadata");
      return { received: true };
    }

    const order = await Order.findById(orderId);
    if (!order) {
      console.error(`Stripe webhook: order ${orderId} not found in DB`);
      return { received: true };
    }

    // Guard against duplicate webhook delivery
    if (order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.transactionId = session.payment_intent as string;
      await order.save();

      if (order.role === "student") {
        await enrollStudentCourses(order);
      }

      if (order.role === "company") {
        await upsertCompanyLicenses(order);
      }

      await sendOrderConfirmationEmail(order);

      console.log(`✅ Order ${orderId} marked as paid via Stripe.`);
    } else {
      console.log(`ℹ️  Order ${orderId} already paid — skipping duplicate.`);
    }
  }

  // ── Session expired ────────────────────────────────────────────────────────
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as any;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, { paymentStatus: "failed" });
      console.log(`❌ Order ${orderId} marked as failed (session expired).`);
    }
  }

  return { received: true };
};

// ─── Payment Status ───────────────────────────────────────────────────────────

const getOrderPaymentStatus = async (id: string) => {
  const order = await Order.findById(id).select(
    "paymentStatus transactionId createdAt"
  );
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }
  return order;
};

// ─── Legacy direct-create (admin use) ────────────────────────────────────────

const createOrderIntoDB = async (payload: Partial<TOrder>) => {
  const { buyerId, role, items } = payload;

  if (role === "student" && buyerId && items && items.length > 0) {
    await assertStudentNotDuplicateEnrollment(buyerId.toString(), items as any);
  }

  const orderRef = await generateUniqueOrderRef();

  const order = await Order.create({ ...payload, orderRef });

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
    await upsertCompanyLicenses({ ...order.toObject(), buyerId, items });
  }

  await sendOrderConfirmationEmail(order);

  return order;
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const OrderServices = {
  getAllOrderFromDB,
  getSingleOrderFromDB,
  updateOrderIntoDB,
  createOrderIntoDB,
  initiateStripePayment,
  handleStripeWebhook,
  getOrderPaymentStatus,
};