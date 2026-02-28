import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { CourseModule } from "./courseModule.model";
import { TCourseModule } from "./courseModule.interface";
import { CourseModuleSearchableFields } from "./courseModule.constant";

const getAllCourseModuleFromDB = async (query: Record<string, unknown>) => {
  const CourseModuleQuery = new QueryBuilder(CourseModule.find(), query)
    .search(CourseModuleSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await CourseModuleQuery.countTotal();
  const result = await CourseModuleQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleCourseModuleFromDB = async (id: string) => {
  const result = await CourseModule.findById(id);
  return result;
};

const updateCourseModuleIntoDB = async (id: string, payload: Partial<TCourseModule>) => {
  const courseModule = await CourseModule.findById(id);
  if (!courseModule) {
    throw new AppError(httpStatus.NOT_FOUND, "CourseModule not found");
  }

  const result = await CourseModule.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};
const deleteSingleCourseModuleFromDB = async (id: string) => {
    const courseModule = await CourseModule.findById(id);
  if (!courseModule) {
    throw new AppError(httpStatus.NOT_FOUND, "CourseModule not found");
  }

  const result = await CourseModule.findByIdAndDelete(id);
  return result;
};

const createCourseModuleIntoDB = async (payload: Partial<TCourseModule>) => {
  const result = await CourseModule.create(payload);
  return result;
};



const reorderCourseModuleFromDB = async (
  courseId: string,
  payload: any[]
) => {
  if (!payload || payload.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Payload is empty");
  }

  // Validate that all IDs exist in this course
  const existingModules = await CourseModule.find({ courseId }).select("_id").lean();
  const existingIds = existingModules.map((m) => m._id.toString());

  for (const item of payload) {
    if (!existingIds.includes(item.id)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `CourseModule ID ${item.id} does not belong to course ${courseId}`
      );
    }
  }

  // Prepare bulk operations
  const bulkOps = payload.map((item) => ({
    updateOne: {
      filter: { _id: item.id, courseId },
      update: { $set: { index: item.index } },
    },
  }));

  // Execute bulk update
  await CourseModule.bulkWrite(bulkOps as any);

  // Return updated sorted modules
  const updatedModules = await CourseModule.find({ courseId }).sort({ index: 1 });
  return updatedModules;
};


export const CourseModuleServices = {
  getAllCourseModuleFromDB,
  getSingleCourseModuleFromDB,
  updateCourseModuleIntoDB,
  createCourseModuleIntoDB,
  deleteSingleCourseModuleFromDB,
  reorderCourseModuleFromDB
  
};
