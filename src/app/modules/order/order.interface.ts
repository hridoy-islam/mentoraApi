/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";

export type TOrderItem = {
  courseId: Types.ObjectId;
  quantity: number; 
  unitPrice: number;
  subTotal: number;
};

export type TOrder = {
  buyerId: Types.ObjectId; // User or Company ID
  items: TOrderItem[];     // Array allows buying multiple DIFFERENT courses at once
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "failed";
  transactionId?: string;
  discount:Number;
  couponCode:string;
  role: "student" | "company"; // Helps distinguish logic easily
};