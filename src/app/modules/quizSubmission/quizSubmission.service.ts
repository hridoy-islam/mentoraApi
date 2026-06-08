import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { QuizSubmission } from "./quizSubmission.model";
import { TQuizSubmission } from "./quizSubmission.interface";
import { QuizSubmissionSearchableFields } from "./quizSubmission.constant";
import { QuestionBank } from "../questionBank/questionBank.model";
import { Lesson } from "../lesson/lesson.model";


// ─── Internal helper: evaluate raw answers against stored correct answers ────
const evaluateAnswers = async (lessonId: string, providedAnswers: { questionId: string; providedAnswer: string[] }[]) => {
  const lesson = await Lesson.findById(lessonId)
    .select('+questions.correctAnswers')
    .lean();
  
  if (!lesson) {
    throw new AppError(httpStatus.NOT_FOUND, "Lesson not found");
  }

  const evaluatedAnswers = [];
  let totalScore = 0;

  for (const ans of providedAnswers) {
    let correctAnswers: string[] = [];

    // 1. Check embedded lesson questions first
    const embeddedQuestion = lesson.questions?.find(
      (q: any) => q._id.toString() === ans.questionId.toString()
    );

    if (embeddedQuestion) {
      correctAnswers = embeddedQuestion.correctAnswers || [];
    } else {
      // 2. Fall back to QuestionBank (imported questions)
      const qbQuestion = await QuestionBank.findById(ans.questionId);
      if (qbQuestion) {
        correctAnswers = qbQuestion.correctAnswers || [];
      } else {
        throw new AppError(
          httpStatus.NOT_FOUND,
          `Question not found for ID: ${ans.questionId}`
        );
      }
    }

    // 3. Strict comparison — same length and every selected value must match
    const isCorrect =
      ans.providedAnswer.length === correctAnswers.length &&
      [...ans.providedAnswer].sort().every(
        (val, index) => val === [...correctAnswers].sort()[index]
      );

    const marksAwarded = isCorrect ? 1 : 0;
    totalScore += marksAwarded;

    evaluatedAnswers.push({
      questionId: ans.questionId,
      providedAnswer: ans.providedAnswer,
      correctAnswers, // <-- ADDED THIS LINE to save the correct answer in the DB
      isCorrect,
      marksAwarded,
    });
  }

  // 4. Pass = 50 % or above
  const isPassed = totalScore >= providedAnswers.length / 2;

  return { evaluatedAnswers, totalScore, isPassed };
};


// ─── GET ALL ─────────────────────────────────────────────────────────────────
const getAllQuizSubmissionFromDB = async (query: Record<string, unknown>) => {
  const QuizSubmissionQuery = new QueryBuilder(QuizSubmission.find(), query)
    .search(QuizSubmissionSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await QuizSubmissionQuery.countTotal();
  const result = await QuizSubmissionQuery.modelQuery;

  return { meta, result };
};


// ─── GET ONE ──────────────────────────────────────────────────────────────────
const getSingleQuizSubmissionFromDB = async (id: string) => {
  const result = await QuizSubmission.findById(id);
  return result;
};


// ─── CREATE / UPSERT ─────────────────────────────────────────────────────────
// The frontend sends raw { questionId, providedAnswer[] } — we evaluate here.
const createQuizSubmissionIntoDB = async (payload: Partial<TQuizSubmission>) => {
  const { studentId, courseId, lessonId, answers } = payload;

  if (!studentId || !courseId || !lessonId || !answers) {
    throw new AppError(httpStatus.BAD_REQUEST, "Missing required fields");
  }

  // Evaluate raw answers
  const { evaluatedAnswers, totalScore, isPassed } = await evaluateAnswers(
    lessonId.toString(),
    answers as { questionId: string; providedAnswer: string[] }[]
  );

  // Upsert: if a submission already exists for this student + lesson, update it
  const existingSubmission = await QuizSubmission.findOne({ studentId, lessonId });

  if (existingSubmission) {
    existingSubmission.answers = evaluatedAnswers as any;
    existingSubmission.totalScore = totalScore;
    existingSubmission.isPassed = isPassed;
    existingSubmission.attemptNumber += 1;

    await existingSubmission.save();
    return existingSubmission;
  }

  // First attempt — create new document
  const result = await QuizSubmission.create({
    ...payload,
    attemptNumber: 1,
    answers: evaluatedAnswers,
    totalScore,
    isPassed,
  });

  return result;
};


// ─── UPDATE (retry via PATCH /quiz-submission/:id) ───────────────────────────
const updateQuizSubmissionIntoDB = async (id: string, payload: Partial<TQuizSubmission>) => {
  const quizSubmission = await QuizSubmission.findById(id);
  if (!quizSubmission) {
    throw new AppError(httpStatus.NOT_FOUND, "QuizSubmission not found");
  }

  const updatedData: Partial<TQuizSubmission> = { ...payload };

  if (payload.answers) {
    const lessonIdToUse = payload.lessonId
      ? payload.lessonId.toString()
      : quizSubmission.lessonId.toString();

    const { evaluatedAnswers, totalScore, isPassed } = await evaluateAnswers(
      lessonIdToUse,
      payload.answers as { questionId: string; providedAnswer: string[] }[]
    );

    updatedData.answers = evaluatedAnswers as any;
    updatedData.totalScore = totalScore;
    updatedData.isPassed = isPassed;
    updatedData.attemptNumber = quizSubmission.attemptNumber + 1;
  }

  const result = await QuizSubmission.findByIdAndUpdate(id, updatedData, {
    new: true,
    runValidators: true,
  });

  return result;
};


// ─── DELETE ───────────────────────────────────────────────────────────────────
const deleteQuizSubmissionFromDB = async (id: string) => {
  const quizSubmission = await QuizSubmission.findById(id);
  if (!quizSubmission) {
    throw new AppError(httpStatus.NOT_FOUND, "QuizSubmission not found");
  }
  const result = await QuizSubmission.findByIdAndDelete(id);
  return result;
};


export const QuizSubmissionServices = {
  getAllQuizSubmissionFromDB,
  getSingleQuizSubmissionFromDB,
  createQuizSubmissionIntoDB,
  updateQuizSubmissionIntoDB,
  deleteQuizSubmissionFromDB,
};