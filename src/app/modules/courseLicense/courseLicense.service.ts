import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { CourseLicense } from "./courseLicense.model";
import { TCourseLicense } from "./courseLicense.interface";
import { CourseLicenseSearchableFields } from "./courseLicense.constant";

const getAllCourseLicenseFromDB = async (query: Record<string, unknown>) => {
  const CourseLicenseQuery = new QueryBuilder(CourseLicense.find().populate("courseId","title image"), query)
    .search(CourseLicenseSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await CourseLicenseQuery.countTotal();
  const result = await CourseLicenseQuery.modelQuery;

  return {
    meta,
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
