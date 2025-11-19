import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { CategoryServices } from "./category.service";

const getAllCategory: RequestHandler = catchAsync(async (req, res) => {
  const result = await CategoryServices.getAllCategoryFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Categorys retrived succesfully",
    data: result,
  });
});
const getSingleCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryServices.getSingleCategoryFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category is retrieved succesfully",
    data: result,
  });
});

const deleteSingleCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryServices.deleteCategoryFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category is deleted succesfully",
    data: result,
  });
});


const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CategoryServices.updateCategoryIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category is updated succesfully",
    data: result,
  });
});

const createCategory: RequestHandler = catchAsync(async (req, res) => {
  const result = await CategoryServices.createCategoryIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

export const CategoryControllers = {
  getAllCategory,
  getSingleCategory,
  updateCategory,
  createCategory,
  deleteSingleCategory
  
};
