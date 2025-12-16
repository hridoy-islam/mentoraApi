import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { CourseLicense } from "./courseLicense.model";
import { TCourseLicense } from "./courseLicense.interface";
import { CourseLicenseSearchableFields } from "./courseLicense.constant";
import { Order } from "../order/order.model";
import mongoose from "mongoose";

const getAllCourseLicenseFromDB = async (query: Record<string, unknown>) => {
  const CourseLicenseQuery = new QueryBuilder(CourseLicense.find().populate("courseId","title image"), query)
    .search(CourseLicenseSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();
let totalOrderAmount = 0;

  if (query.companyId) {
    const totalAmountStats = await Order.aggregate([
      {
        $match: {
          buyerId: new mongoose.Types.ObjectId(query.companyId as string),
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    totalOrderAmount = totalAmountStats.length > 0 ? totalAmountStats[0].totalAmount : 0;
  }

  const meta = await CourseLicenseQuery.countTotal();
  const result = await CourseLicenseQuery.modelQuery;

  return {
    meta,
    totalOrderAmount, 
    result,
  };
};

const getSingleCourseLicenseFromDB = async (id: string) => {
  const result = await CourseLicense.findById(id).populate("instructorId");
  return result;
};

const updateCourseLicenseIntoDB = async (id: string, payload: Partial<TCourseLicense>) => {
  const courseLicense = await CourseLicense.findById(id).populate("instructorId","name").populate("categoryId","name");
  if (!courseLicense) {
    throw new AppError(httpStatus.NOT_FOUND, "CourseLicense not found");
  }

  const result = await CourseLicense.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


const createCourseLicenseIntoDB = async (payload: Partial<TCourseLicense>) => {
  const result = await CourseLicense.create(payload);
  return result;
  
};




export const CourseLicenseServices = {
  getAllCourseLicenseFromDB,
  getSingleCourseLicenseFromDB,
  updateCourseLicenseIntoDB,
  createCourseLicenseIntoDB
  
};
