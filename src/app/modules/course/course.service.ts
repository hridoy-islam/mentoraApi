import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Course } from "./course.model";
import { TCourse } from "./course.interface";
import { CourseSearchableFields } from "./course.constant";

const getAllCourseFromDB = async (query: Record<string, unknown>) => {
  const CourseQuery = new QueryBuilder(Course.find().populate("instructorId","name").populate("categoryId","name"), query)
    .search(CourseSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await CourseQuery.countTotal();
  const result = await CourseQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleCourseFromDB = async (id: string) => {
  const result = await Course.findById(id);
  return result;
};

const updateCourseIntoDB = async (id: string, payload: Partial<TCourse>) => {
  const course = await Course.findById(id).populate("instructorId","name").populate("categoryId","name");
  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, "Course not found");
  }

  const result = await Course.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


const createCourseIntoDB = async (payload: Partial<TCourse>) => {
  const result = await Course.create(payload);
  return result;
};




export const CourseServices = {
  getAllCourseFromDB,
  getSingleCourseFromDB,
  updateCourseIntoDB,
  createCourseIntoDB
  
};
