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


export const OrderRoutes = router;
