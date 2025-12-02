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

export const OrderControllers = {
  getAllOrder,
  getSingleOrder,
  updateOrder,
  createOrder
  
};
