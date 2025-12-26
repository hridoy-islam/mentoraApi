 

import express from "express";
import { PaymentController } from "./payment.controller";
// import auth from "../../middlewares/auth"; 

const router = express.Router();

router.post(
  "/checkout",

  PaymentController.worldPayPayment
);

export const PaymentRoutes = router;