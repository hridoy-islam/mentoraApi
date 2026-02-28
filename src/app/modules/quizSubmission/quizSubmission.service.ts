import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { QuizSubmission } from "./quizSubmission.model";
import { TQuizSubmission } from "./quizSubmission.interface";
import { QuizSubmissionSearchableFields } from "./quizSubmission.constant";
import { QuestionBank } from "../questionBank/questionBank.model";
import { Lesson } from "../lesson/lesson.model";


const evaluateAnswers = async (lessonId: string, providedAnswers: any[]) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw new AppError(httpStatus.NOT_FOUND, "Lesson not found");
  }

  const evaluatedAnswers = [];
  let totalScore = 0;

  for (const ans of providedAnswers) {
    let correctAnswers: string[] = [];

    // 1. Check if the question exists inside the embedded Lesson questions
    const embeddedQuestion = lesson.questions?.find(
      (q: any) => q._id.toString() === ans.questionId.toString()
    );

    if (embeddedQuestion) {
      correctAnswers = embeddedQuestion.correctAnswers || [];
    } else {
      // 2. If not found in Lesson, check QuestionBank
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

    // 3. Strict Comparison: Check if the provided answer matches the correct answers EXACTLY.
    // Length must be equal, and every selected option must be in the correct answers.
    const isCorrect =
      ans.providedAnswer.length === correctAnswers.length &&
      [...ans.providedAnswer].sort().every((val, index) => val === [...correctAnswers].sort()[index]);

    // 4. Assign marks
    const marksAwarded = isCorrect ? 1 : 0; 
    totalScore += marksAwarded;

    evaluatedAnswers.push({
      questionId: ans.questionId,
      providedAnswer: ans.providedAnswer,
      isCorrect,
      marksAwarded,
    });
  }

  // 5. Determine Passing Logic (e.g., 50% required to pass)
  const isPassed = totalScore >= providedAnswers.length / 2;

  return { evaluatedAnswers, totalScore, isPassed };
};



const getAllQuizSubmissionFromDB = async (query: Record<string, unknown>) => {
  const QuizSubmissionQuery = new QueryBuilder(QuizSubmission.find(), query)
    .search(QuizSubmissionSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await QuizSubmissionQuery.countTotal();
  const result = await QuizSubmissionQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleQuizSubmissionFromDB = async (id: string) => {
  const result = await QuizSubmission.findById(id);
  return result;
};

const createQuizSubmissionIntoDB = async (payload: Partial<TQuizSubmission>) => {
  const { studentId, courseId, lessonId, answers } = payload;

  if (!studentId || !courseId || !lessonId || !answers) {
    throw new AppError(httpStatus.BAD_REQUEST, "Missing required fields");
  }

  // 1. Evaluate the new answers
  const { evaluatedAnswers, totalScore, isPassed } = await evaluateAnswers(
    lessonId.toString(),
    answers
  );

  // 2. Check if a submission ALREADY exists for this student and lesson
  const existingSubmission = await QuizSubmission.findOne({
    studentId,
    lessonId,
  });

  // 3. IF EXISTS -> UPDATE IT
  if (existingSubmission) {
    existingSubmission.answers = evaluatedAnswers;
    existingSubmission.totalScore = totalScore;
    existingSubmission.isPassed = isPassed;
    existingSubmission.attemptNumber += 1; // Increment the attempt count

    await existingSubmission.save();
    return existingSubmission;
  }

  // 4. IF IT DOES NOT EXIST -> CREATE NEW
  const submissionPayload = {
    ...payload,
    attemptNumber: 1,
    answers: evaluatedAnswers,
    totalScore,
    isPassed,
  };

  const result = await QuizSubmission.create(submissionPayload);
  return result;
};


// Update Quiz Submission (Retries)
const updateQuizSubmissionIntoDB = async (id: string, payload: Partial<TQuizSubmission>) => {
  const quizSubmission = await QuizSubmission.findById(id);
  if (!quizSubmission) {
    throw new AppError(httpStatus.NOT_FOUND, "QuizSubmission not found");
  }

  let updatedData = { ...payload };

  if (payload.answers) {
    const lessonIdToUse = payload.lessonId ? payload.lessonId.toString() : quizSubmission.lessonId.toString();
    
    const { evaluatedAnswers, totalScore, isPassed } = await evaluateAnswers(
      lessonIdToUse,
      payload.answers
    );

    updatedData.answers = evaluatedAnswers;
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
  updateQuizSubmissionIntoDB,
  createQuizSubmissionIntoDB,
  deleteQuizSubmissionFromDB
  
};
