/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";

export interface TCourseModule {
  courseId: Types.ObjectId; // reference to parent course
  title: string;
  index?: string;
  description?: string;
}
