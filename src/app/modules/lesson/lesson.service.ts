import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Lesson } from "./lesson.model";
import { TLesson } from "./lesson.interface";
import { LessonSearchableFields } from "./lesson.constant";

const getAllLessonFromDB = async (query: Record<string, unknown>) => {
  const LessonQuery = new QueryBuilder(Lesson.find(), query)
    .search(LessonSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await LessonQuery.countTotal();
  const result = await LessonQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleLessonFromDB = async (id: string) => {
  const result = await Lesson.findById(id).populate('importedQuestions');
  return result;
};
const deleteSingleLessonFromDB = async (id: string) => {
    const lesson = await Lesson.findById(id);
  if (!lesson) {
    throw new AppError(httpStatus.NOT_FOUND, "Lesson not found");
  }
  const result = await Lesson.findByIdAndDelete(id);
  return result;
};

const updateLessonIntoDB = async (id: string, payload: Partial<TLesson>) => {
  const lesson = await Lesson.findById(id);
  if (!lesson) {
    throw new AppError(httpStatus.NOT_FOUND, "Lesson not found");
  }

  const result = await Lesson.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


const createLessonIntoDB = async (payload: Partial<TLesson>) => {
  const lastLesson = await Lesson.findOne({ moduleId: payload.moduleId })
    .sort({ index: -1 }) // highest index first
    .lean();

  //  Set the next index
  const nextIndex = lastLesson ? (lastLesson.index ?? 0) + 1 : 0;

  // Apply index if not provided manually
  payload.index = payload.index ?? nextIndex;

  const result = await Lesson.create(payload);
  return result;
};


export const reorderLessonFromDB = async (
  moduleId: string,
  payload: any[]
) => {
  if (!payload || payload.length === 0) {
    throw new Error("Payload is empty");
  }

  // Optional: Validate that all IDs exist in this module
  const existingLessons = await Lesson.find({ moduleId }).select("_id").lean();
  const existingIds = existingLessons.map(l => l._id.toString());

  for (const item of payload) {
    if (!existingIds.includes(item.id)) {
      throw new Error(`Lesson ID ${item.id} does not belong to module ${moduleId}`);
    }
  }

  // Prepare bulk operations
  const bulkOps = payload.map(item => ({
    updateOne: {
      filter: { _id: item.id, moduleId },
      update: { $set: { index: item.index } },
    },
  }));

  // Execute bulk update
  await Lesson.bulkWrite(bulkOps as any);

  // Return updated sorted lessons
  const updatedLessons = await Lesson.find({ moduleId }).sort({ index: 1 });
  return updatedLessons;
};

export const LessonServices = {
  getAllLessonFromDB,
  getSingleLessonFromDB,
  updateLessonIntoDB,
  createLessonIntoDB,
  reorderLessonFromDB,
  deleteSingleLessonFromDB
  
};
