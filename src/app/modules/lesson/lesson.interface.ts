/* eslint-disable no-unused-vars */
import { Types } from "mongoose";

export type LessonType = "video" | "doc" | "quiz";

export interface QuizQuestion {
  question: string;
  type: "mcq" | "short";
  options?: string[];
  correctAnswers?: string[];
  shortAnswer?: string;
}

export interface DeductionRule {
  attempt: number;
  deduction: number;
  constantDeduction?: boolean;
}

export interface QuizConfig {
  totalMarks?: number;
  passMarks?: number;
  maxAttempts?: number;
  deductionRules?: DeductionRule[];
  constantDeductionAfterMax?: number;
}

export interface TLesson {
  moduleId: Types.ObjectId;
  title: string;
  type: LessonType;
  duration?: string;

  index?: number;
  lock?: boolean;
  prerequisiteLesson?: Types.ObjectId | null;

  videoUrl?: string;

  content?: string;

  questions?: QuizQuestion[];

  additionalFiles?: string[];
  additionalNote?: string;
  importedQuestions?: Types.ObjectId[];
  // New quiz configuration
  quizConfig?: QuizConfig;
}
