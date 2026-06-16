import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Lesson } from "./lesson.model";
import { TLesson } from "./lesson.interface";
import { LessonSearchableFields } from "./lesson.constant";
import { QuizSubmission } from "../quizSubmission/quizSubmission.model";

// The Fisher-Yates (Knuth) Shuffle Algorithm
const shuffleArray = (array: any[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const getQuizForStudentFromDB = async (lessonId: string, studentId: string) => {
  const lesson = await Lesson.findById(lessonId).populate("importedQuestions").lean();
  if (!lesson || lesson.type !== "quiz") {
    throw new AppError(httpStatus.NOT_FOUND, "Quiz not found");
  }

  // 1. Get history
  const submission = await QuizSubmission.findOne({ lessonId, studentId }).lean();
  const seenIds = submission?.seenQuestions?.map((id) => id.toString()) || [];

  // 2. Filter available
  const allQuestions = [...(lesson.questions || []), ...(lesson.importedQuestions || [])];
  let availableQuestions = allQuestions.filter((q: any) => !seenIds.includes(q._id.toString()));

  // 3. Reset if exhausted
  if (availableQuestions.length === 0) {
    availableQuestions = allQuestions;
  }

  // 4. Shuffle and slice
  const shuffled = shuffleArray(availableQuestions);
  const limit = lesson.quizConfig?.totalMarks || 5;
  const selected = shuffled.slice(0, limit);

  // 5. Sanitize
  return selected.map(({ correctAnswers, shortAnswer, ...rest }) => rest);
};

const getAllLessonFromDB = async (query: Record<string, unknown>) => {
  const isQuiz = query.isQuiz === "true" || query.isQuiz === true;
  const { isQuiz: _, ...dbQuery } = query;

  const LessonQuery = new QueryBuilder(
    Lesson.find().populate({
      path: "importedQuestions",
      select: isQuiz ? "-correctAnswers -shortAnswer" : undefined,
    }),
    dbQuery
  )
    .search(LessonSearchableFields)
    .filter(dbQuery)
    .sort()
    .paginate()
    .fields();

  const meta = await LessonQuery.countTotal();
  const rawResult = await LessonQuery.modelQuery.lean();

  const result = isQuiz
    ? rawResult.map((lesson) => ({
        ...lesson,
        questions:
          lesson.type === "quiz"
            ? lesson.questions?.map(({ correctAnswers, shortAnswer, ...rest }) => rest)
            : lesson.questions,
      }))
    : rawResult;

  return { meta, result };
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
  deleteSingleLessonFromDB,
  getQuizForStudentFromDB
  
};
