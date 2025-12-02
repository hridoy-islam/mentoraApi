import { Schema, model, Model, Types } from "mongoose";
import { TCourseLicense } from "./courseLicense.interface";

const CourseLicenseSchema = new Schema<TCourseLicense>(
 {
    companyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    totalSeats: { type: Number, required: true },
    usedSeats: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CourseLicense: Model<TCourseLicense> = model<TCourseLicense>("CourseLicense", CourseLicenseSchema);
