import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { QuestionBank } from "./questionBank.model";
import { TQuestionBank } from "./questionBank.interface";
import { QuestionBankSearchableFields } from "./questionBank.constant";

const getAllQuestionBankFromDB = async (query: Record<string, unknown>) => {
  const QuestionBankQuery = new QueryBuilder(QuestionBank.find(), query)
    .search(QuestionBankSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await QuestionBankQuery.countTotal();
  const result = await QuestionBankQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleQuestionBankFromDB = async (id: string) => {
  const result = await QuestionBank.findById(id);
  return result;
};

const updateQuestionBankIntoDB = async (id: string, payload: Partial<TQuestionBank>) => {
  const questionBank = await QuestionBank.findById(id);
  if (!questionBank) {
    throw new AppError(httpStatus.NOT_FOUND, "QuestionBank not found");
  }

  const result = await QuestionBank.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


const createQuestionBankIntoDB = async (payload: Partial<TQuestionBank>) => {
  const result = await QuestionBank.create(payload);
  return result;
};


const deleteSingleQuestionBankFromDB = async (id: string) => {
   const questionBank = await QuestionBank.findById(id);
  if (!questionBank) {
    throw new AppError(httpStatus.NOT_FOUND, "QuestionBank not found");
  }
  const result = await QuestionBank.findByIdAndDelete(id);
  return result;
};




export const QuestionBankServices = {
  getAllQuestionBankFromDB,
  getSingleQuestionBankFromDB,
  updateQuestionBankIntoDB,
  createQuestionBankIntoDB
  
};
