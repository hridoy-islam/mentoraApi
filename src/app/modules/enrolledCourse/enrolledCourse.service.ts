import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { EnrolledCourse } from "./enrolledCourse.model";
import { TEnrolledCourse } from "./enrolledCourse.interface";
import { EnrolledCourseSearchableFields } from "./enrolledCourse.constant";
import { CourseLicense } from "../courseLicense/courseLicense.model";
import mongoose from "mongoose";
import { Course } from "../course/course.model";
import { User } from "../user/user.model";
import { v4 as uuidv4 } from "uuid";

export const generateUniqueRefId = async (
  session?: mongoose.ClientSession,
): Promise<string> => {
  let isUnique = false;
  let newRefId = "";
 
  while (!isUnique) {
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const year = currentDate.getFullYear();
 
    // Generate a 5-digit string from uuid
    let numericUuid = uuidv4().replace(/\D/g, "");
    if (numericUuid.length < 5) {
      numericUuid = numericUuid.padEnd(5, "0");
    }
    const uniqueCode = numericUuid.substring(0, 5);
 
    newRefId = `MT-${month}-${year}-${uniqueCode}`;
 
    // Check if this refId already exists in the database
    const existingCourse = await EnrolledCourse.findOne({
      refId: newRefId,
    }).session(session || null);
 
    // If it doesn't exist, we break the loop
    if (!existingCourse) {
      isUnique = true;
    }
  }
 
  return newRefId;
};


const getAllEnrolledCourseFromDB = async (query: Record<string, unknown>) => {
  const EnrolledCourseQuery = new QueryBuilder(
    EnrolledCourse.find().populate("studentId", "name email").populate({
      path: "courseId",
      select: "title  categoryId slug image",
    }),
    query,
  )
    .search(EnrolledCourseSearchableFields)
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

const updateEnrolledCourseIntoDB = async (
  id: string,
  payload: Partial<TEnrolledCourse>,
) => {
  const enrolledCourse = await EnrolledCourse.findById(id);
  if (!enrolledCourse) {
    throw new AppError(httpStatus.NOT_FOUND, "EnrolledCourse not found");
  }
  if (payload.progress === 100) {
    payload.status = "completed";
    payload.completedDate = new Date();
  }
  const result = await EnrolledCourse.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};





// const createEnrolledCourseIntoDB = async (
//   payload: Partial<TEnrolledCourse>,
// ) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     if (payload.licenseId && payload.studentId) {
//       const isAlreadyEnrolled = await EnrolledCourse.findOne({
//         studentId: payload.studentId,
//         licenseId: payload.licenseId,
//       }).session(session);

//       if (isAlreadyEnrolled) {
//         throw new AppError(
//           httpStatus.CONFLICT,
//           "Student is already enrolled using this license",
//         );
//       }
//     }

//     if (payload.licenseId) {
//       const license = await CourseLicense.findById(payload.licenseId).session(
//         session,
//       );

//       if (!license) {
//         throw new AppError(httpStatus.NOT_FOUND, "License not found");
//       }

//       if (license.usedSeats >= license.totalSeats) {
//         throw new AppError(
//           httpStatus.BAD_REQUEST,
//           "No available seats remaining",
//         );
//       }

//       const student = await User.findById(payload.studentId).select("name");
//       const course = await Course.findById(payload.courseId).select("title");

//       const message = `${student?.name ?? "User"} enrolled in ${
//         course?.title ?? "course"
//       }`;

//       await CourseLicense.findByIdAndUpdate(
//         payload.licenseId,
//         {
//           $inc: { usedSeats: 1 },
//           $push: {
//             staffEnrollmentLogs: {
//               userId: payload.studentId,
//               courseId: payload.courseId,
//               message,
//             },
//           },
//         },
//         { session, new: true },
//       );
//     }

//     const result = await EnrolledCourse.create([payload], { session });

//     if (!result.length) {
//       throw new AppError(httpStatus.BAD_REQUEST, "Failed to enroll in course");
//     }

//     await session.commitTransaction();
//     await session.endSession();

//     return result[0];
//   } catch (error) {
//     await session.abortTransaction();
//     await session.endSession();
//     throw error;
//   }
// };

const createEnrolledCourseIntoDB = async (
  payload: Partial<TEnrolledCourse>,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (payload.licenseId && payload.studentId) {
      const isAlreadyEnrolled = await EnrolledCourse.findOne({
        studentId: payload.studentId,
        licenseId: payload.licenseId,
      }).session(session);

      if (isAlreadyEnrolled) {
        throw new AppError(
          httpStatus.CONFLICT,
          "Student is already enrolled using this license",
        );
      }
    }

    if (payload.licenseId) {
      const license = await CourseLicense.findById(payload.licenseId).session(
        session,
      );

      if (!license) {
        throw new AppError(httpStatus.NOT_FOUND, "License not found");
      }

      if (license.usedSeats >= license.totalSeats) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "No available seats remaining",
        );
      }

      const student = await User.findById(payload.studentId).select("name");
      const course = await Course.findById(payload.courseId).select("title");

      const message = `${student?.name ?? "User"} enrolled in ${
        course?.title ?? "course"
      }`;

      await CourseLicense.findByIdAndUpdate(
        payload.licenseId,
        {
          $inc: { usedSeats: 1 },
          $push: {
            staffEnrollmentLogs: {
              userId: payload.studentId,
              courseId: payload.courseId,
              message,
            },
          },
        },
        { session, new: true },
      );
    }

    // Generate a strictly unique refId and assign it to the payload
    // We pass the session here so the DB check respects the active transaction
   payload.refId = await generateUniqueRefId(session);
   
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
  createEnrolledCourseIntoDB,
};
