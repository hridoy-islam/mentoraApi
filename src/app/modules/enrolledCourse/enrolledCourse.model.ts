import { Schema, model, Model, Types } from "mongoose";
import { TEnrolledCourse } from "./enrolledCourse.interface";

const EnrolledCourseSchema = new Schema<TEnrolledCourse>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // Who paid?
    purchasedBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // or "Company"
      required: true,
    },

    licenseId: {
      type: Schema.Types.ObjectId,
      ref: "License",
    },

    status: {
      type: String,
      enum: ["active", "completed", "dropped"],
      default: "active",
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    completedModules: [
      {
        type: Schema.Types.ObjectId,
        ref: "CourseModule",
      },
    ],

    completedLessons: [
      {
        type: Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],

    startDate: {
      type: Date,
    },

    completedDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const EnrolledCourse: Model<TEnrolledCourse> = model<TEnrolledCourse>(
  "EnrolledCourse",
  EnrolledCourseSchema
);
