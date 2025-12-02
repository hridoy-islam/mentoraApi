/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";

export interface TEnrolledCourse {
 studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  
  // Who paid? 
  purchasedBy: Types.ObjectId; // Could be the Student themselves or a Company
  licenseId?: Types.ObjectId;  // Optional: If part of a company bulk license
  
  status: "active" | "completed" | "dropped";
  progress: number;
  completedModules: Types.ObjectId[];
  startDate: Date;
  completedLessons: Types.ObjectId[];
  completedDate?: Date;
}
