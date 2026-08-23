/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";
export type TFAQ = {
  question: string;
  answer: string;
};


export type TTestimonial = {
  name: string;
  review: string;
};

export interface TCourse {
  title: string;
  courseOverview:string;
  courseGuideUrl: string;
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
    faq?: TFAQ[];
      testimonial?: TTestimonial[];


  status: "block" | "active";
}
