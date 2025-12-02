import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { CourseLicenseServices } from "./courseLicense.service";

const getAllCourseLicense: RequestHandler = catchAsync(async (req, res) => {
  const result = await CourseLicenseServices.getAllCourseLicenseFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CourseLicenses retrived succesfully",
    data: result,
  });
});
const getSingleCourseLicense = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CourseLicenseServices.getSingleCourseLicenseFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CourseLicense is retrieved succesfully",
    data: result,
  });
});

const updateCourseLicense = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CourseLicenseServices.updateCourseLicenseIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CourseLicense is updated succesfully",
    data: result,
  });
});

const createCourseLicense: RequestHandler = catchAsync(async (req, res) => {
  const result = await CourseLicenseServices.createCourseLicenseIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "CourseLicense created successfully",
    data: result,
  });
});

export const CourseLicenseControllers = {
  getAllCourseLicense,
  getSingleCourseLicense,
  updateCourseLicense,
  createCourseLicense
  
};
