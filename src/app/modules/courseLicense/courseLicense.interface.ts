/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";

export interface ILicenseLog {
  orderId: Types.ObjectId;
  seats?: number;
  message?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface IStaffEnrollmentLog {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  message?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export type TCourseLicense = {
companyId: Types.ObjectId;
  courseId: Types.ObjectId;
  orderIds: Types.ObjectId[];
  totalSeats: number;
  usedSeats: number;
  isActive: boolean;
  logs: ILicenseLog[];
  createdAt?: Date;
  updatedAt?: Date;
  staffEnrollmentLogs?: IStaffEnrollmentLog[];
};