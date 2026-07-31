import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { sendContractEmailServices } from "./sendContractEmail.service";

const sendContactForm: RequestHandler = catchAsync(async (req, res) => {
  const result = await sendContractEmailServices.sendContactFormIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message sent successfully!",
    data: result,
  });
});

export const sendContractEmailControllers = {
  sendContactForm,
};
