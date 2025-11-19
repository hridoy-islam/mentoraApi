import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Lesson } from "./lesson.model";
import { TLesson } from "./lesson.interface";
import { LessonSearchableFields } from "./lesson.constant";

const getAllLessonFromDB = async (query: Record<string, unknown>) => {
  const LessonQuery = new QueryBuilder(Lesson.find(), query)
    .search(LessonSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await LessonQuery.countTotal();
  const result = await LessonQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleLessonFromDB = async (id: string) => {
  const result = await Lesson.findById(id);
  return result;
};

const updateLessonIntoDB = async (id: string, payload: Partial<TLesson>) => {
  const lesson = await Lesson.findById(id);
  if (!lesson) {
    throw new AppError(httpStatus.NOT_FOUND, "Lesson not found");
  }

  const result = await Lesson.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


const createLessonIntoDB = async (payload: Partial<TLesson>) => {
  const result = await Lesson.create(payload);
  return result;
};




export const LessonServices = {
  getAllLessonFromDB,
  getSingleLessonFromDB,
  updateLessonIntoDB,
  createLessonIntoDB
  
};
