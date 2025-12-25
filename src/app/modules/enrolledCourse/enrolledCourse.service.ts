import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { EnrolledCourse } from "./enrolledCourse.model";
import { TEnrolledCourse } from "./enrolledCourse.interface";
import { EnrolledCourseSearchableFields } from "./enrolledCourse.constant";
import { CourseLicense } from "../courseLicense/courseLicense.model";
import mongoose from "mongoose";

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
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (payload.licenseId && payload.studentId) {
      const isAlreadyEnrolled = await EnrolledCourse.findOne({
        studentId: payload.studentId,
        licenseId: payload.licenseId,
      }).session(session);

      if (isAlreadyEnrolled) {
        throw new AppError(httpStatus.CONFLICT, "Student is already enrolled using this license");
      }
    }

    if (payload.licenseId) {
      const license = await CourseLicense.findById(payload.licenseId).session(session);

      if (!license) {
        throw new AppError(httpStatus.NOT_FOUND, "License not found");
      }

      if (license.usedSeats >= license.totalSeats) {
        throw new AppError(httpStatus.NOT_FOUND, "EnrolledCourse not found");
      }

      await CourseLicense.findByIdAndUpdate(
        payload.licenseId,
        {
          $inc: { usedSeats: 1 },
        },
        { session, new: true }
      );
    }

    const result = await EnrolledCourse.create([payload], { session });

    if (!result.length) {
      throw new AppError(httpStatus.BAD_REQUEST, "Failed to enroll in course");
    }

    await session.commitTransaction();
    await session.endSession();

    return result[0];
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};



export const EnrolledCourseServices = {
  getAllEnrolledCourseFromDB,
  getSingleEnrolledCourseFromDB,
  updateEnrolledCourseIntoDB,
  createEnrolledCourseIntoDB
  
};
