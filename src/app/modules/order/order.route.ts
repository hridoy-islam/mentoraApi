/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { OrderControllers } from "./order.controller";

const router = express.Router();
router.get(
  "/",
  OrderControllers.getAllOrder
);
router.post(
  "/",
  // auth("admin", "instructor","company","student"),
  OrderControllers.createOrder
);
router.get(
  "/:id",
  OrderControllers.getSingleOrder
);

router.patch(
  "/:id",
  auth("admin", "instructor"),

  OrderControllers.updateOrder
);

// 1. User clicks Pay → backend creates pending order + returns Worldpay URL
router.post("/initiate-payment", auth(), OrderControllers.initiatePayment);
 
// 2. Worldpay calls this after payment — NO auth middleware
router.post("/webhook/worldpay", OrderControllers.worldpayWebhook);
 
// 3. Frontend polls this to check if webhook has confirmed payment
router.get("/payment-status/:id", auth(), OrderControllers.getPaymentStatus);


export const OrderRoutes = router;
