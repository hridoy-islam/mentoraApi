import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { CourseModuleServices } from "./courseModule.service";

const getAllCourseModule: RequestHandler = catchAsync(async (req, res) => {
  const result = await CourseModuleServices.getAllCourseModuleFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CourseModules retrived succesfully",
    data: result,
  });
});
const getSingleCourseModule = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CourseModuleServices.getSingleCourseModuleFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CourseModule is retrieved succesfully",
    data: result,
  });
});

const updateCourseModule = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CourseModuleServices.updateCourseModuleIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CourseModule is updated succesfully",
    data: result,
  });
});

const createCourseModule: RequestHandler = catchAsync(async (req, res) => {
  const result = await CourseModuleServices.createCourseModuleIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "CourseModule created successfully",
    data: result,
  });
});

const deleteSingleCourseModule = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CourseModuleServices.deleteSingleCourseModuleFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CourseModule is deleted succesfully",
    data: result,
  });
});

const reorderCourseModule = catchAsync(async (req, res) => {
  const { id: courseId } = req.params; 
  const { modules } = req.body; 

  if (!Array.isArray(modules) || modules.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Invalid modules payload",
      data: null,
    });
  }

  const result = await CourseModuleServices.reorderCourseModuleFromDB(courseId, modules);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Course modules reordered successfully",
    data: result,
  });
});



export const CourseModuleControllers = {
  getAllCourseModule,
  getSingleCourseModule,
  updateCourseModule,
  createCourseModule,
  deleteSingleCourseModule,
  reorderCourseModule
  
};
