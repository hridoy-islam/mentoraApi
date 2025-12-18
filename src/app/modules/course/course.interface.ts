/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";

export interface TCourse {
  title: string;
  description: string;
  categoryId: Types.ObjectId;
  image: string;
  slug: string;
  instructorId: Types.ObjectId;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  students?: number;
  duration?: number; // total hours (optional, can calculate)
  totalLessons?: number;
  resources?: number;
  learningPoints?: string[];
  requirements?: string[];
  aboutDescription?: string;
  status: "block" | "active";
}
