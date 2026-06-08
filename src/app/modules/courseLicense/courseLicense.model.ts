import { Schema, model, Model, Types } from "mongoose";
import { ILicenseLog, IStaffEnrollmentLog, TCourseLicense } from "./courseLicense.interface";

const LicenseLogSchema = new Schema<ILicenseLog>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },

    seats: { type: Number },
    message: { type: String },
  },
  {
    timestamps: true,
  },
);


const staffEnrollmentLogSchema = new Schema<IStaffEnrollmentLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    message: { type: String },
  },
  {
    timestamps: true,
  },
);

const CourseLicenseSchema = new Schema<TCourseLicense>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    courseId: 
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
        required: true,
      },
    
    orderIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    totalSeats: {
      type: Number,
      required: true,
      min: 0,
    },
    usedSeats: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    logs: [LicenseLogSchema],
    staffEnrollmentLogs: [staffEnrollmentLogSchema],
  },
  {
    timestamps: true,
  },
);

export const CourseLicense: Model<TCourseLicense> = model<TCourseLicense>(
  "CourseLicense",
  CourseLicenseSchema,
);
