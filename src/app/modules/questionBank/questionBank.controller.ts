import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { QuestionBankServices } from "./questionBank.service";

const getAllQuestionBank: RequestHandler = catchAsync(async (req, res) => {
  const result = await QuestionBankServices.getAllQuestionBankFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QuestionBanks retrived succesfully",
    data: result,
  });
});
const getSingleQuestionBank = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await QuestionBankServices.getSingleQuestionBankFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QuestionBank is retrieved succesfully",
    data: result,
  });
});

const updateQuestionBank = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await QuestionBankServices.updateQuestionBankIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QuestionBank is updated succesfully",
    data: result,
  });
});

const createQuestionBank: RequestHandler = catchAsync(async (req, res) => {
  const result = await QuestionBankServices.createQuestionBankIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "QuestionBank created successfully",
    data: result,
  });
});

export const QuestionBankControllers = {
  getAllQuestionBank,
  getSingleQuestionBank,
  updateQuestionBank,
  createQuestionBank
  
};
