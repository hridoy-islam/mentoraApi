/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";
export type TFAQ = {
  question: string;
  answer: string;
};
export interface TCourse {
  title: string;
  courseOverview:string;
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
    faq?: TFAQ[];

  status: "block" | "active";
}
