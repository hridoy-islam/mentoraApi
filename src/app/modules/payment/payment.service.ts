// modules/payment/payment.service.ts

import httpStatus from "http-status";
import axios from "axios";
import AppError from "../../errors/AppError";
import { TWorldPayPayment } from "./payment.interface";
// import { Order } from "../order/order.model"; // Uncomment if you want to save to DB

// --- CONFIGURATION ---
// In a real app, put these in your .env file
const WORLDPAY_SERVICE_KEY = process.env.WORLDPAY_SERVICE_KEY || "your_service_key_here"; 
const WORLDPAY_MERCHANT_ID = process.env.WORLDPAY_MERCHANT_ID || "your_merchant_id_here";
const WORLDPAY_URL = "https://try.access.worldpay.com/orders"; // Use 'https://access.worldpay.com/orders' for Live

const processWorldPayPayment = async (payload: TWorldPayPayment) => {
  const { paymentSessionId, amount, currency = "USD", description, customerName, customerEmail } = payload;

  try {
    if (!paymentSessionId) {
      throw new AppError(httpStatus.BAD_REQUEST, "Payment Session ID is missing");
    }

    // 1. Construct the Worldpay API Request payload
    const worldpayBody = {
      transactionReference: `Ref-${Date.now()}`, // Unique ID for this transaction
      merchant: {
        entity: WORLDPAY_MERCHANT_ID
      },
      instruction: {
        description: description || "Course Purchase",
        value: {
          currency: currency,
          amount: amount // Ensure this matches Worldpay format (usually standard integer/float for Access Worldpay)
        },
        paymentInstrument: { 
          type: "checkout/session",
          href: paymentSessionId // The Verified Token/Session from Frontend
        }
      },
      // Optional: Add shopper details for fraud screening
      shopper: {
         name: customerName,
         emailAddress: customerEmail 
      }
    };

    // 2. Call Worldpay API
    const response = await axios.post(WORLDPAY_URL, worldpayBody, {
      headers: {
        'Authorization': `Basic ${WORLDPAY_SERVICE_KEY}`,
        'Content-Type': 'application/vnd.worldpay.orders-v1.hal+json',
        'Accept': 'application/vnd.worldpay.orders-v1.hal+json'
      }
    });

    // 3. Handle Success
    const paymentResult = response.data;
    
    // (Optional) Save Order to your Database here
    // const newOrder = await Order.create({ ... });

    return {
      success: true,
      transactionId: paymentResult.transactionReference,
      status: paymentResult.outcome, // 'authorized', 'refused', etc.
      worldpayResponse: paymentResult
    };

  } catch (error: any) {
    console.error("Worldpay Payment Failed:", error?.response?.data || error.message);
    
    // Handle specific Worldpay errors
    const errorMessage = error?.response?.data?.description || "Payment processing failed";
    throw new AppError(httpStatus.PAYMENT_REQUIRED, errorMessage);
  }
};

export const PaymentService = {
  processWorldPayPayment,
};