import { Types } from "mongoose";

export type TAnswerRecord = {
  questionId: Types.ObjectId; // References the specific question in Lesson or QuestionBank
  providedAnswer: string[];   // Array of strings to handle multiple-choice (e.g., ["A", "C"]) or single short answers
  isCorrect: boolean;         // Evaluated when the quiz is submitted
  correctAnswers?: string[];     // Stored correct answers for reference (not required to save, but can be useful for review)
  marksAwarded: number;       // How many marks they got for this specific question
};

export type TQuizSubmission = {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: Types.ObjectId;   // The specific Lesson where type === "quiz"
  
  attemptNumber: number;      // 1st attempt, 2nd attempt, etc.
  answers: TAnswerRecord[];
  
  totalScore: number;         // Total marks achieved in this attempt
  isPassed: boolean;          // Evaluated against lesson.quizConfig.passMarks
  
  startedAt?: Date;
  submittedAt: Date;
};