import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Course } from "./course.model";
import { TCourse } from "./course.interface";
import { CourseSearchableFields } from "./course.constant";
import slugify from "slugify";

import { Types } from "mongoose"

const getAllCourseFromDB = async (query: Record<string, unknown>) => {
  const {
    minPrice,
    maxPrice,
    sort = "default",
    category,
  } = query as {
    minPrice?: string
    maxPrice?: string
    sort?: string
    category?: string
  }


  const filter: any = {
    status: "active",
  }

  if (category && Types.ObjectId.isValid(category)) {
    filter.categoryId = category
  }

 
  if (minPrice !== undefined && maxPrice !== undefined) {
    filter.price = {
      $gte: Number(minPrice),
      $lte: Number(maxPrice),
    }
  }

  
  let courseQuery = Course.find(filter)
    .populate("instructorId", "name")
    .populate("categoryId", "name")

  if (sort === "low-to-high") {
    courseQuery = courseQuery.sort({ price: 1 })
  } else if (sort === "high-to-low") {
    courseQuery = courseQuery.sort({ price: -1 })
  }

  const CourseQuery = new QueryBuilder(courseQuery, query)
    .search(CourseSearchableFields)
    .paginate()
    .fields()

  const meta = await CourseQuery.countTotal()
  const result = await CourseQuery.modelQuery

  return {
    meta,
    result,
  }
}


const getSingleCourseFromDB = async (id: string) => {
  const result = await Course.findById(id).populate("instructorId");
  return result;
};

const updateCourseIntoDB = async (id: string, payload: Partial<TCourse>) => {
  const course = await Course.findById(id).populate("instructorId","name").populate("categoryId","name");
  if (!course) {
    throw new AppError(httpStatus.NOT_FOUND, "Course not found");
  }
if (payload.title) {
    payload.slug = slugify(payload.title, {
      lower: true,
      strict: true,
      trim: true,
    });
  }
  const result = await Course.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


const createCourseIntoDB = async (payload: Partial<TCourse>) => {

  if (payload.title) {
    payload.slug = slugify(payload.title, {
      lower: true,     
      strict: true,     
      trim: true,    
    });
  }
  const result = await Course.create(payload);
  return result;
};




export const CourseServices = {
  getAllCourseFromDB,
  getSingleCourseFromDB,
  updateCourseIntoDB,
  createCourseIntoDB
  
};
