/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";


export type TCourseLicense = {
 companyId: Types.ObjectId;
  courseId: Types.ObjectId;
  orderId: Types.ObjectId;     // Track which order bought these seats
  totalSeats: number;          // e.g., 50
  usedSeats: number;           // e.g., 0 initially, increments as they invite employees
  isActive: boolean;
};