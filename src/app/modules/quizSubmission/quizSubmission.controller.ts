import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { QuizSubmissionServices } from "./quizSubmission.service";

const getAllQuizSubmission: RequestHandler = catchAsync(async (req, res) => {
  const result = await QuizSubmissionServices.getAllQuizSubmissionFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QuizSubmissions retrived succesfully",
    data: result,
  });
});
const getSingleQuizSubmission = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await QuizSubmissionServices.getSingleQuizSubmissionFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QuizSubmission is retrieved succesfully",
    data: result,
  });
});

const deleteSingleQuizSubmission = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await QuizSubmissionServices.deleteQuizSubmissionFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QuizSubmission is deleted succesfully",
    data: result,
  });
});


const updateQuizSubmission = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await QuizSubmissionServices.updateQuizSubmissionIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QuizSubmission is updated succesfully",
    data: result,
  });
});

const createQuizSubmission: RequestHandler = catchAsync(async (req, res) => {
  const result = await QuizSubmissionServices.createQuizSubmissionIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "QuizSubmission created successfully",
    data: result,
  });
});

export const QuizSubmissionControllers = {
  getAllQuizSubmission,
  getSingleQuizSubmission,
  updateQuizSubmission,
  createQuizSubmission,
  deleteSingleQuizSubmission
  
};
