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
import { sendEnrollmentEmail } from "../../utils/sendEnrollmentEmail";
import { sendCompletionEmail } from "../../utils/sendCompletionEmail";
import config from "../../config";

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

// Sends course-completion emails. Always emails the student; when the course
// was provided via a company license, the company user is also notified.
const sendCompletionEmails = async (enrolledCourse: any) => {
  const student = await User.findById(enrolledCourse.studentId).select(
    "name email",
  );
  const course = await Course.findById(enrolledCourse.courseId).select("title");

  if (!student?.email) return;

  const memberName = student.name || "A member";
  const courseTitle = course?.title || "a course";
  const refId = enrolledCourse.refId || "";
  const certificateUrl = `${config.frontend_url}/student/certificates`;

  // License case: resolve the company user so both the student and the
  // company get notified.
  let company: any = null;
  if (enrolledCourse.licenseId) {
    const license = await CourseLicense.findById(enrolledCourse.licenseId)
      .populate("companyId", "name email");
    company = license?.companyId;
  }

  // Student: congratulations + certificate details + button to view it
  sendCompletionEmail(
    student.email,
    "course-completion-student",
    `Congratulations ${memberName}! You completed ${courseTitle}`,
    {
      name: memberName,
      courseTitle,
      companyName: company?.name || "",
      refId,
      certificateUrl,
    },
  ).catch((err) =>
    console.error("Failed to send completion email to student:", err),
  );

  // Company: notify that the employee completed the course (only for licenses)
  if (company?.email) {
    const staffEnrollUrl = `${config.frontend_url}/dashboard/company/courses/staff/${enrolledCourse.licenseId}`;
    sendCompletionEmail(
      company.email,
      "course-completion-company",
      `${memberName} has completed ${courseTitle}`,
      {
        name: company.name || "Your organisation",
        memberName,
        courseTitle,
        companyName: company.name || "",
        refId,
        staffEnrollUrl,
      },
    ).catch((err) =>
      console.error("Failed to send completion email to company:", err),
    );
  }
};

const updateEnrolledCourseIntoDB = async (
  id: string,
  payload: Partial<TEnrolledCourse>,
) => {
  const enrolledCourse = await EnrolledCourse.findById(id);
  if (!enrolledCourse) {
    throw new AppError(httpStatus.NOT_FOUND, "EnrolledCourse not found");
  }
  // Only fire the completion emails on the transition to 100% — not on later
  // PATCHes that keep re-sending progress = 100.
  const isNewlyCompleted =
    enrolledCourse.progress !== 100 && payload.progress === 100;
  if (payload.progress === 100) {
    payload.status = "completed";
    payload.completedDate = new Date();
  }
  const result = await EnrolledCourse.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  // Send completion emails (non-blocking — fire and forget)
  if (isNewlyCompleted && result) {
    sendCompletionEmails(result).catch((err) =>
      console.error("Failed to send course completion email:", err),
    );
  }

  return result;
};


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

    let student: any = null;
    let course: any = null;

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

      student = await User.findById(payload.studentId).select("name email");
      course = await Course.findById(payload.courseId).select("title");

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

    // Send enrollment emails (non-blocking — fire and forget)
    if (payload.licenseId) {
      const license = await CourseLicense.findById(payload.licenseId)
        .populate("companyId", "name email");

      const company: any = license?.companyId;
      const memberName = student?.name || "A member";
      const courseTitle = course?.title || "a course";

      if (student?.email) {
        sendEnrollmentEmail(
          student.email,
          "enrollment-student",
          "You're enrolled — start learning!",
          {
            memberName,
            courseTitle,
            companyName: company?.name || "Your organisation",
          }
        ).catch((err) => console.error("Failed to send enrollment email to member:", err));
      }

      if (company?.email) {
        sendEnrollmentEmail(
          company.email,
          "enrollment-company",
          `${memberName} has enrolled in ${courseTitle}`,
          {
            memberName,
            courseTitle,
          }
        ).catch((err) => console.error("Failed to send enrollment email to company:", err));
      }
    }

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
