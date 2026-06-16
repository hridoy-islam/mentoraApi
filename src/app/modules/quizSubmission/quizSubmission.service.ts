import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { QuizSubmission } from "./quizSubmission.model";
import { TQuizSubmission } from "./quizSubmission.interface";
import { QuizSubmissionSearchableFields } from "./quizSubmission.constant";
import { QuestionBank } from "../questionBank/questionBank.model";
import { Lesson } from "../lesson/lesson.model";


const evaluateAnswers = async (lessonId: string, providedAnswers: { questionId: string; providedAnswer: string[] }[]) => {
  const lesson = await Lesson.findById(lessonId).lean();

  if (!lesson) {
    throw new AppError(httpStatus.NOT_FOUND, "Lesson not found");
  }

  // Calculate dynamic point metrics based on actual questions evaluated
  const totalConfiguredMarks = lesson.quizConfig?.totalMarks || 5; 
  const weightPerQuestion = providedAnswers.length > 0 
    ? totalConfiguredMarks / providedAnswers.length 
    : 0;

  const evaluatedAnswers = [];
  let totalScore = 0;

  for (const ans of providedAnswers) {
    let correctAnswers: string[] = [];

    const embeddedQuestion = lesson.questions?.find(
      (q: any) => q._id.toString() === ans.questionId.toString()
    );

    if (embeddedQuestion) {
      correctAnswers = embeddedQuestion.correctAnswers || [];
    } else {
      const qbQuestion = await QuestionBank.findById(ans.questionId).select('+correctAnswers');
      if (qbQuestion) {
        correctAnswers = qbQuestion.correctAnswers || [];
      } else {
        throw new AppError(httpStatus.NOT_FOUND, `Question not found for ID: ${ans.questionId}`);
      }
    }

    // Fixed missing open-bracket syntax issue safely here
    const isCorrect =
      ans.providedAnswer.length === correctAnswers.length &&
      ([...ans.providedAnswer]).sort().every(
        (val, index) => val === ([...correctAnswers]).sort()[index]
      );

    const marksAwarded = isCorrect ? weightPerQuestion : 0;
    totalScore += marksAwarded;

    evaluatedAnswers.push({
      questionId: ans.questionId,
      providedAnswer: ans.providedAnswer,
      correctAnswers,
      isCorrect,
      marksAwarded: Number(marksAwarded.toFixed(2)),
    });
  }

  totalScore = Number(totalScore.toFixed(2));
  const isPassed = totalScore >= totalConfiguredMarks / 2;

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
// const createQuizSubmissionIntoDB = async (payload: Partial<TQuizSubmission>) => {
//   const { studentId, courseId, lessonId, answers } = payload;

//   if (!studentId || !courseId || !lessonId || !answers) {
//     throw new AppError(httpStatus.BAD_REQUEST, "Missing required fields");
//   }

//   // Evaluate raw answers
//   const { evaluatedAnswers, totalScore, isPassed } = await evaluateAnswers(
//     lessonId.toString(),
//     answers as any[]
//   );

//   // Upsert: if a submission already exists for this student + lesson, update it
//   const existingSubmission = await QuizSubmission.findOne({ studentId, lessonId });

//   if (existingSubmission) {
//     existingSubmission.answers = evaluatedAnswers as any;
//     existingSubmission.totalScore = totalScore;
//     existingSubmission.isPassed = isPassed;
//     existingSubmission.attemptNumber += 1;

//     await existingSubmission.save();
//     return existingSubmission;
//   }

//   // First attempt — create new document
//   const result = await QuizSubmission.create({
//     ...payload,
//     attemptNumber: 1,
//     answers: evaluatedAnswers,
//     totalScore,
//     isPassed,
//   });

//   return result;
// };


// // ─── UPDATE (retry via PATCH /quiz-submission/:id) ───────────────────────────
// const updateQuizSubmissionIntoDB = async (id: string, payload: Partial<TQuizSubmission>) => {
//   const quizSubmission = await QuizSubmission.findById(id);
//   if (!quizSubmission) {
//     throw new AppError(httpStatus.NOT_FOUND, "QuizSubmission not found");
//   }

//   const updatedData: Partial<TQuizSubmission> = { ...payload };

//   if (payload.answers) {
//     const lessonIdToUse = payload.lessonId
//       ? payload.lessonId.toString()
//       : quizSubmission.lessonId.toString();

//     const { evaluatedAnswers, totalScore, isPassed } = await evaluateAnswers(
//       lessonIdToUse,
//       payload.answers as any[]
//     );

//     updatedData.answers = evaluatedAnswers as any;
//     updatedData.totalScore = totalScore;
//     updatedData.isPassed = isPassed;
//     updatedData.attemptNumber = quizSubmission.attemptNumber + 1;
//   }

//   const result = await QuizSubmission.findByIdAndUpdate(id, updatedData, {
//     new: true,
//     runValidators: true,
//   });

//   return result;
// };


















const createQuizSubmissionIntoDB = async (payload: Partial<TQuizSubmission>) => {
  const { studentId, courseId, lessonId, answers } = payload;

  if (!studentId || !courseId || !lessonId || !answers) {
    throw new AppError(httpStatus.BAD_REQUEST, "Missing required fields");
  }

  // 1. Evaluate answers
  const { evaluatedAnswers, totalScore, isPassed } = await evaluateAnswers(
    lessonId.toString(),
    answers as any[]
  );

  // 2. Track "seen" questions
  const currentAttemptQuestionIds = evaluatedAnswers.map(a => a.questionId.toString());

  // 3. Upsert logic
  const existingSubmission = await QuizSubmission.findOne({ studentId, lessonId });

  if (existingSubmission) {
    // Merge new questions into seenQuestions
    const previousSeen = existingSubmission.seenQuestions.map(id => id.toString());
    let updatedSeen = Array.from(new Set([...previousSeen, ...currentAttemptQuestionIds]));

    // Check if total questions exhausted (Reset logic)
    const lesson = await Lesson.findById(lessonId);
    const totalAvailable = (lesson?.questions?.length || 0) + (lesson?.importedQuestions?.length || 0);

    if (updatedSeen.length >= totalAvailable && totalAvailable > 0) {
      updatedSeen = currentAttemptQuestionIds; // Reset: only the current ones are 'seen'
    }

    existingSubmission.answers = evaluatedAnswers as any;
    existingSubmission.totalScore = totalScore;
    existingSubmission.isPassed = isPassed;
    existingSubmission.attemptNumber += 1;
    existingSubmission.seenQuestions = updatedSeen as any;

    await existingSubmission.save();
    return existingSubmission;
  }

  // 4. First attempt
  const result = await QuizSubmission.create({
    ...payload,
    attemptNumber: 1,
    answers: evaluatedAnswers,
    totalScore,
    isPassed,
    seenQuestions: currentAttemptQuestionIds, // Initialize seen questions
  });

  return result;
};

const updateQuizSubmissionIntoDB = async (id: string, payload: Partial<TQuizSubmission>) => {
  const quizSubmission = await QuizSubmission.findById(id);
  if (!quizSubmission) {
    throw new AppError(httpStatus.NOT_FOUND, "QuizSubmission not found");
  }

  if (payload.answers) {
    const { evaluatedAnswers, totalScore, isPassed } = await evaluateAnswers(
      quizSubmission.lessonId.toString(),
      payload.answers as any[]
    );

    const currentAttemptQuestionIds = evaluatedAnswers.map(a => a.questionId.toString());
    const previousSeen = quizSubmission.seenQuestions.map(id => id.toString());
    let updatedSeen = Array.from(new Set([...previousSeen, ...currentAttemptQuestionIds]));

    const lesson = await Lesson.findById(quizSubmission.lessonId);
    const totalAvailable = (lesson?.questions?.length || 0) + (lesson?.importedQuestions?.length || 0);

    if (updatedSeen.length >= totalAvailable && totalAvailable > 0) {
      updatedSeen = currentAttemptQuestionIds;
    }

    payload.answers = evaluatedAnswers as any;
    payload.totalScore = totalScore as any;
    payload.isPassed = isPassed as any;
    payload.attemptNumber = quizSubmission.attemptNumber + 1;
    (payload as any).seenQuestions = updatedSeen;
  }

  const result = await QuizSubmission.findByIdAndUpdate(id, payload, {
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