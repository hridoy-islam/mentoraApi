import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { EnrolledCourseServices } from "./enrolledCourse.service";

const getAllEnrolledCourse: RequestHandler = catchAsync(async (req, res) => {
  const result = await EnrolledCourseServices.getAllEnrolledCourseFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EnrolledCourses retrived succesfully",
    data: result,
  });
});
const getSingleEnrolledCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await EnrolledCourseServices.getSingleEnrolledCourseFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EnrolledCourse is retrieved succesfully",
    data: result,
  });
});

const updateEnrolledCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await EnrolledCourseServices.updateEnrolledCourseIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EnrolledCourse is updated succesfully",
    data: result,
  });
});

const createEnrolledCourse: RequestHandler = catchAsync(async (req, res) => {
  const result = await EnrolledCourseServices.createEnrolledCourseIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "EnrolledCourse created successfully",
    data: result,
  });
});

export const EnrolledCourseControllers = {
  getAllEnrolledCourse,
  getSingleEnrolledCourse,
  updateEnrolledCourse,
  createEnrolledCourse
  
};
