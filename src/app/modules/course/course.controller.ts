import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { CourseServices } from "./course.service";

const getAllCourse: RequestHandler = catchAsync(async (req, res) => {
  const result = await CourseServices.getAllCourseFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courses retrived succesfully",
    data: result,
  });
});
const getSingleCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CourseServices.getSingleCourseFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Course is retrieved succesfully",
    data: result,
  });
});
const getSingleCourseBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const result = await CourseServices.getSingleCourseBySlugFromDB(slug);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Course is retrieved succesfully",
    data: result,
  });
});

const updateCourse = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CourseServices.updateCourseIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Course is updated succesfully",
    data: result,
  });
});

const createCourse: RequestHandler = catchAsync(async (req, res) => {
  const result = await CourseServices.createCourseIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Course created successfully",
    data: result,
  });
});

export const CourseControllers = {
  getAllCourse,
  getSingleCourse,
  updateCourse,
  createCourse,
  getSingleCourseBySlug
  
};
