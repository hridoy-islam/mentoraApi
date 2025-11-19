import { Schema, model, Model, Types } from "mongoose";
import { TCourseModule } from "./courseModule.interface";

const CourseModuleSchema = new Schema<TCourseModule>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    }
  },
  {
    timestamps: true,
  }
);

export const CourseModule: Model<TCourseModule> =
  model<TCourseModule>("CourseModule", CourseModuleSchema);
