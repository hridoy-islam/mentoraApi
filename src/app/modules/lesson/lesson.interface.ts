/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";

export type LessonType = "video" | "doc" | "quiz";

/** Quiz Question supports:
 * - MCQ (options array + correctAnswer index)
 * - Short Answer (text answer)
 */
export interface QuizQuestion {
  question: string;
  type: "mcq" | "short"; // NEW FIELD
  options?: string[]; // only for MCQ
  correctAnswer?: number; // index for MCQ
  shortAnswer?: string; // only for short question
}

export interface TLesson {
  moduleId: Types.ObjectId; // reference to parent module
  title: string;
  type: LessonType;
  duration: string;
  videoUrl?: string;
  content?: string;
  questions?: QuizQuestion[];
}
