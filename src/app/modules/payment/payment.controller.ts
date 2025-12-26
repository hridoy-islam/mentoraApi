// modules/payment/payment.controller.ts

import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { PaymentService } from "./payment.service";

const worldPayPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.processWorldPayPayment(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment processed successfully",
    data: result,
  });
});

export const PaymentController = {
  worldPayPayment
};