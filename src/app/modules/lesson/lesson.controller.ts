import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { LessonServices } from "./lesson.service";

const getAllLesson: RequestHandler = catchAsync(async (req, res) => {
  const result = await LessonServices.getAllLessonFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Lessons retrived succesfully",
    data: result,
  });
});
const getSingleLesson = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await LessonServices.getSingleLessonFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Lesson is retrieved succesfully",
    data: result,
  });
});

const updateLesson = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await LessonServices.updateLessonIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Lesson is updated succesfully",
    data: result,
  });
});

const createLesson: RequestHandler = catchAsync(async (req, res) => {
  const result = await LessonServices.createLessonIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Lesson created successfully",
    data: result,
  });
});

export const reorderLesson = catchAsync(async (req, res) => {
  const { id: moduleId } = req.params; // moduleId from URL
  const { lessons } = req.body; // payload: [{id, index}, ...]

  if (!Array.isArray(lessons) || lessons.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Invalid lessons payload",
      data: null,
    });
  }

  const result = await LessonServices.reorderLessonFromDB(moduleId, lessons);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Lessons reordered successfully",
    data: result,
  });
});

export const LessonControllers = {
  getAllLesson,
  getSingleLesson,
  updateLesson,
  createLesson,
  reorderLesson
  
};
