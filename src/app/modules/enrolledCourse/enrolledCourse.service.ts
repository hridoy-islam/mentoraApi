import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { EnrolledCourse } from "./enrolledCourse.model";
import { TEnrolledCourse } from "./enrolledCourse.interface";
import { EnrolledCourseSearchableFields } from "./enrolledCourse.constant";

const getAllEnrolledCourseFromDB = async (query: Record<string, unknown>) => {
const EnrolledCourseQuery = new QueryBuilder(
    EnrolledCourse.find()
  .populate('studentId', 'name email')
  .populate({
    path: 'courseId',
    select: 'title instructorId categoryId slug image',
    populate: [
      {
        path: 'instructorId',
        select: 'name',
      },
      {
        path: 'categoryId',
        select: 'name',
      },
    ],
  }),
    query
  ).search(EnrolledCourseSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await EnrolledCourseQuery.countTotal();
  const result = await EnrolledCourseQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleEnrolledCourseFromDB = async (id: string) => {
  const result = await EnrolledCourse.findById(id).populate("instructorId");
  return result;
};

const updateEnrolledCourseIntoDB = async (id: string, payload: Partial<TEnrolledCourse>) => {
  const enrolledCourse = await EnrolledCourse.findById(id).populate("instructorId","name").populate("categoryId","name");
  if (!enrolledCourse) {
    throw new AppError(httpStatus.NOT_FOUND, "EnrolledCourse not found");
  }

  const result = await EnrolledCourse.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


const createEnrolledCourseIntoDB = async (payload: Partial<TEnrolledCourse>) => {
  const result = await EnrolledCourse.create(payload);
  return result;
};




export const EnrolledCourseServices = {
  getAllEnrolledCourseFromDB,
  getSingleEnrolledCourseFromDB,
  updateEnrolledCourseIntoDB,
  createEnrolledCourseIntoDB
  
};
